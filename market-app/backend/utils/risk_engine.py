"""Portfolio risk analytics engine using NumPy and Pandas."""
from __future__ import annotations

import logging
import numpy as np
import pandas as pd
import yfinance as yf
from cache import cache_get, cache_set

log = logging.getLogger(__name__)

BENCHMARK_TICKER = "^NSEI"  # NIFTY 50 on Yahoo Finance

def get_historical_returns(symbols: list[str], period: str = "1y") -> tuple[pd.DataFrame, pd.Series]:
    """Fetch historical daily close prices and compute returns for symbols and the Nifty 50 benchmark."""
    # Normalize period abbreviations to yfinance format
    period_map = {"1m": "1mo", "3m": "3mo", "6m": "6mo"}
    period = period_map.get(period.lower(), period)
    
    all_symbols = list(set(symbols + [BENCHMARK_TICKER]))
    
    # Try caching the returns data for 1 hour to prevent constant yfinance querying
    cache_key = f"risk_returns:{':'.join(sorted(symbols))}:{period}"
    cached = cache_get(cache_key)
    if cached:
        try:
            df_prices = pd.read_json(cached)
            df_returns = df_prices.pct_change().dropna()
            return df_returns[symbols], df_returns[BENCHMARK_TICKER]
        except Exception:
            pass

    price_data = {}
    for sym in all_symbols:
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period=period, interval="1d")
            if not hist.empty:
                price_data[sym] = hist["Close"]
            else:
                log.warning("No historical price data for %s", sym)
        except Exception:
            log.exception("Failed to fetch historical returns for %s", sym)

    if not price_data or BENCHMARK_TICKER not in price_data:
        raise ValueError("Could not fetch benchmark or stock data for risk modeling.")

    df_prices = pd.DataFrame(price_data).ffill().bfill()
    df_returns = df_prices.pct_change().dropna()

    # Cache prices JSON string
    try:
        cache_set(cache_key, df_prices.to_json(), ttl=3600)
    except Exception:
        pass

    # Ensure symbols are in df_returns columns
    valid_symbols = [s for s in symbols if s in df_returns.columns]
    return df_returns[valid_symbols], df_returns[BENCHMARK_TICKER]


def calculate_risk_metrics(holdings: list[dict], period: str = "1y", num_simulations: int = 1000, horizon_days: int = 30) -> dict:
    """
    Calculate portfolio risk metrics:
    - Individual stock betas & portfolio beta
    - Asset correlation matrix
    - Monte Carlo 30-day value path simulation
    - 95% Value-at-Risk (VaR) & Expected Shortfall (ES)
    """
    if not holdings:
        return {}

    symbols = [h["symbol"] for h in holdings]
    # Parse quantities & purchase prices
    initial_values = []
    total_val = 0.0
    for h in holdings:
        qty = float(h.get("quantity") or 0)
        price = float(h.get("price") or 0)
        val = qty * price
        initial_values.append(val)
        total_val += val

    if total_val <= 0:
        # Fallback to equal weights if no quantity is provided
        weights = np.ones(len(symbols)) / len(symbols)
        total_val = 100000.0  # nominal value for simulation
        initial_values = [total_val * w for w in weights]
    else:
        weights = np.array(initial_values) / total_val

    try:
        df_returns, benchmark_returns = get_historical_returns(symbols, period=period)
    except Exception as e:
        log.exception("Error getting returns for risk metrics")
        return {"error": str(e)}

    # Filter symbols based on returned columns
    active_symbols = list(df_returns.columns)
    if not active_symbols:
        return {"error": "No valid pricing data found for symbols"}

    # Recalculate weights based on active symbols
    active_holdings = [h for h in holdings if h["symbol"] in active_symbols]
    active_initial_values = [float(h.get("quantity", 0)) * float(h.get("price", 0)) for h in active_holdings]
    active_total_val = sum(active_initial_values)
    if active_total_val <= 0:
        active_weights = np.ones(len(active_symbols)) / len(active_symbols)
        active_total_val = 100000.0
    else:
        active_weights = np.array(active_initial_values) / active_total_val

    # 1. Betas
    betas = {}
    bench_var = benchmark_returns.var()
    for sym in active_symbols:
        cov = df_returns[sym].cov(benchmark_returns)
        beta = cov / bench_var if bench_var else 1.0
        betas[sym] = float(beta)

    portfolio_beta = float(np.dot(active_weights, [betas[sym] for sym in active_symbols]))

    # 2. Correlation Matrix
    corr_df = df_returns.corr()
    correlation_matrix = []
    for s1 in active_symbols:
        row = {"symbol": s1}
        for s2 in active_symbols:
            row[s2] = float(corr_df.loc[s1, s2])
        correlation_matrix.append(row)

    # 3. Monte Carlo Simulation
    # Calculate daily parameters
    mean_returns = df_returns.mean()
    cov_matrix = df_returns.cov()

    # Annualized volatility
    volatilities = {}
    for sym in active_symbols:
        volatilities[sym] = float(df_returns[sym].std() * np.sqrt(252))

    # Portfolio historical statistics
    # Daily portfolio returns series
    port_returns = df_returns.dot(active_weights)
    port_vol = port_returns.std()
    port_mean = port_returns.mean()

    # Monte Carlo simulation paths
    # We will simulate daily price changes using Geometric Brownian Motion (GBM)
    # Price(t) = Price(t-1) * exp((mu - 0.5 * sigma^2) + sigma * Z)
    # For multiple correlated assets, we use Cholesky decomposition
    num_assets = len(active_symbols)
    
    # Covariance matrix and mean returns vector
    cov_np = cov_matrix.to_numpy()
    mean_np = mean_returns.to_numpy()

    # Cholesky decomposition: L * L^T = Cov
    # If cov_matrix is not positive semi-definite (e.g. numerical errors), we use near-PSD approximation
    try:
        L = np.linalg.cholesky(cov_np)
    except np.linalg.LinAlgError:
        # Fallback pseudo-decomposition via eigenvalues
        eigvals, eigvecs = np.linalg.eigh(cov_np)
        eigvals = np.maximum(eigvals, 1e-8)  # force positive
        L = eigvecs * np.sqrt(eigvals)

    # Simulation runs: [horizon_days, num_simulations, num_assets]
    # Random normal variables
    Z = np.random.normal(size=(horizon_days, num_simulations, num_assets))
    
    # Initialize price simulation
    # Let's track portfolio value over time.
    # Start portfolio value array: [horizon_days + 1, num_simulations]
    sim_portfolio_values = np.zeros((horizon_days + 1, num_simulations))
    sim_portfolio_values[0, :] = active_total_val

    # Initialize asset prices for each path
    # Asset prices matrix: [num_simulations, num_assets]
    asset_prices = np.zeros((num_simulations, num_assets))
    for idx, sym in enumerate(active_symbols):
        # Start at last known price in df_returns' columns or current price in quote
        q = cache_get(f"quote:{sym}")
        curr_price = q.get("price") if q else None
        if not curr_price:
            # Fallback to yfinance ticker price
            try:
                curr_price = float(yf.Ticker(sym).fast_info.last_price)
            except Exception:
                curr_price = float(df_prices[sym].iloc[-1]) if 'df_prices' in locals() else 100.0
        
        # Let's adjust holding purchase quantities
        asset_prices[:, idx] = curr_price

    # Get holdings values
    holdings_quantities = []
    for sym in active_symbols:
        h_match = next(h for h in active_holdings if h["symbol"] == sym)
        holdings_quantities.append(float(h_match.get("quantity") or 1))
    holdings_quantities = np.array(holdings_quantities)

    # Run path step simulation
    for t in range(1, horizon_days + 1):
        # Correlate random steps: Z[t-1] is [num_simulations, num_assets]
        # Multiply Z by L^T
        epsilon = Z[t-1].dot(L.T)  # [num_simulations, num_assets]
        
        # Daily return path: exp((mu - 0.5 * sigma^2) + epsilon)
        # Note: epsilon already scales with covariance (so volatility is embedded)
        sigma_sq = np.diag(cov_np)
        drift = mean_np - 0.5 * sigma_sq
        daily_returns = np.exp(drift + epsilon)  # [num_simulations, num_assets]
        
        # Update asset prices
        asset_prices = asset_prices * daily_returns
        
        # Calculate portfolio value at step t for each simulation path
        # Portfolio value = sum over assets (quantity * price)
        sim_portfolio_values[t, :] = asset_prices.dot(holdings_quantities)

    # Compute percentiles across runs for each day
    days_labels = [f"D+{i}" for i in range(horizon_days + 1)]
    median_path = np.percentile(sim_portfolio_values, 50, axis=1)
    bullish_path = np.percentile(sim_portfolio_values, 95, axis=1)
    bearish_path = np.percentile(sim_portfolio_values, 5, axis=1)

    chart_data = []
    for t in range(horizon_days + 1):
        chart_data.append({
            "day": days_labels[t],
            "Neutral": float(median_path[t]),
            "Bullish": float(bullish_path[t]),
            "Bearish": float(bearish_path[t]),
        })

    # Value at Risk (VaR)
    # Daily portfolio returns array at horizon D+30
    ending_values = sim_portfolio_values[-1, :]
    losses = active_total_val - ending_values
    var_95 = float(np.percentile(losses, 95))
    var_pct = float(var_95 / active_total_val * 100)

    # Expected Shortfall (ES)
    tail_losses = losses[losses >= var_95]
    expected_shortfall = float(np.mean(tail_losses)) if len(tail_losses) > 0 else var_95
    es_pct = float(expected_shortfall / active_total_val * 100)

    return {
        "active_total_value": float(active_total_val),
        "portfolio_beta": portfolio_beta,
        "betas": betas,
        "volatilities": volatilities,
        "correlation_matrix": correlation_matrix,
        "simulation_chart": chart_data,
        "var_95": var_95,
        "var_pct": var_pct,
        "expected_shortfall": expected_shortfall,
        "es_pct": es_pct,
        "horizon_days": horizon_days,
        "num_simulations": num_simulations,
    }
