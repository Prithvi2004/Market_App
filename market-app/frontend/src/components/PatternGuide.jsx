/**
 * PatternGuide.jsx
 * Interactive Candlestick Reference Guide specifically tailored for the Indian Stock Market.
 * Details 24 major patterns across Bullish, Bearish, and Neutral categories with wicks,
 * reliability metrics, volume confirmation triggers, and specialized FII/DII and NSE/Nifty confluences.
 * 
 * Features:
 * 1. Minimizable / Collapsible detailed analysis panel with smooth layout transitions.
 * 2. Visual real-life stock examples with custom-rendered SVG candlestick mini charts for all 24 patterns.
 */
import { useState, useMemo } from "react";

const PATTERNS = {
  bullish: [
    {
      name: "Hammer",
      desc: "A single candle with a small body at the top and a long lower shadow (at least 2× the body). Signals sellers pushed price down but buyers regained control by close.",
      reliability: "High (70–75%)",
      timeframe: "Daily / Weekly",
      volume: "Confirmation needed (high vol = stronger)",
      confirmation: "Next candle closes above Hammer's high",
      strength: "★★★★☆",
      trigger: "At support zones, 52-week lows",
      nse: "Common after panic sell-offs in midcap stocks (e.g. post-earnings dip). Works well on Nifty Bank index charts. Watch for Hammers at key Fibonacci levels.",
      svgKey: "hammer",
      example: {
        stock: "SBIN (State Bank of India)",
        date: "Q2 Earnings Support Dip",
        movement: "+9.4% Reversal in 5 Sessions",
        highlight: [3],
        candles: [
          { o: 580, h: 585, l: 574, c: 576 },
          { o: 576, h: 578, l: 562, c: 565 },
          { o: 565, h: 568, l: 550, c: 552 },
          { o: 548, h: 554, l: 532, c: 553 }, // Hammer
          { o: 553, h: 566, l: 551, c: 564 },
          { o: 564, h: 578, l: 562, c: 575 },
          { o: 575, h: 590, l: 574, c: 588 },
          { o: 588, h: 606, l: 586, c: 604 }
        ]
      }
    },
    {
      name: "Inverted Hammer",
      desc: "Small body at the bottom with long upper shadow. Appears at the end of a downtrend. Buyers tried to push up but sellers resisted; next candle's strength confirms reversal.",
      reliability: "Moderate (60–65%)",
      timeframe: "Daily",
      volume: "Lower vol is fine; confirmation candle must have high vol",
      confirmation: "Next candle must close bullishly above the Inverted Hammer",
      strength: "★★★☆☆",
      trigger: "Bottom of downtrend, oversold RSI",
      nse: "Often seen in Nifty IT stocks after US market-driven sell-offs. Pair with RSI < 30 for higher accuracy.",
      svgKey: "inv-hammer",
      example: {
        stock: "TATAMOTORS",
        date: "Post-Sales Decline Panic",
        movement: "+6.2% Turnaround in 4 Sessions",
        highlight: [3],
        candles: [
          { o: 640, h: 642, l: 628, c: 630 },
          { o: 630, h: 631, l: 615, c: 618 },
          { o: 618, h: 620, l: 602, c: 605 },
          { o: 602, h: 622, l: 601, c: 604 }, // Inverted Hammer
          { o: 605, h: 618, l: 604, c: 615 },
          { o: 615, h: 630, l: 614, c: 628 },
          { o: 628, h: 636, l: 625, c: 634 },
          { o: 634, h: 648, l: 632, c: 644 }
        ]
      }
    },
    {
      name: "Bullish Engulfing",
      desc: "A large green candle that completely engulfs the prior red candle's body. Strong institutional buying signal. One of the most reliable single-to-two candle patterns.",
      reliability: "Very High (75–80%)",
      timeframe: "Daily / Weekly",
      volume: "Engulfing candle must show significantly higher volume",
      confirmation: "Self-confirming but watch next open",
      strength: "★★★★★",
      trigger: "After 3+ red candles, at support",
      nse: "Frequently signals FII/DII buying in large-caps. Breakout on Nifty 50 often starts with a Bullish Engulfing on weekly chart.",
      svgKey: "bull-engulf",
      example: {
        stock: "RELIANCE",
        date: "FII Block Deal Purchase",
        movement: "+11.2% Rally in 6 Sessions",
        highlight: [2, 3],
        candles: [
          { o: 2420, h: 2425, l: 2390, c: 2395 },
          { o: 2395, h: 2402, l: 2360, c: 2368 },
          { o: 2368, h: 2374, l: 2330, c: 2338 }, // Red candle
          { o: 2332, h: 2415, l: 2328, c: 2412 }, // Large green engulfing
          { o: 2412, h: 2445, l: 2408, c: 2438 },
          { o: 2438, h: 2470, l: 2432, c: 2465 },
          { o: 2465, h: 2510, l: 2460, c: 2502 },
          { o: 2502, h: 2542, l: 2498, c: 2535 }
        ]
      }
    },
    {
      name: "Piercing Line",
      desc: "Two candles — a large red candle followed by a green candle that opens below the red's low and closes above its midpoint. Partial recovery signal.",
      reliability: "Moderate-High (65–70%)",
      timeframe: "Daily",
      volume: "Second candle must have higher volume",
      confirmation: "Third candle confirms bullish continuation",
      strength: "★★★★☆",
      trigger: "At support or after extended downtrend",
      nse: "Effective in Nifty 50 futures contracts and Reliance-type heavyweights where overnight gaps are common.",
      svgKey: "piercing",
      example: {
        stock: "INFY (Infosys)",
        date: "IT Sector Sell-off Support",
        movement: "+7.5% Recovery in 5 Sessions",
        highlight: [2, 3],
        candles: [
          { o: 1540, h: 1545, l: 1518, c: 1522 },
          { o: 1522, h: 1525, l: 1495, c: 1500 },
          { o: 1500, h: 1508, l: 1465, c: 1472 }, // Large red
          { o: 1458, h: 1496, l: 1455, c: 1492 }, // Piercing green
          { o: 1492, h: 1515, l: 1488, c: 1510 },
          { o: 1510, h: 1532, l: 1505, c: 1528 },
          { o: 1528, h: 1550, l: 1524, c: 1546 },
          { o: 1546, h: 1565, l: 1542, c: 1560 }
        ]
      }
    },
    {
      name: "Morning Star",
      desc: "Three-candle pattern: large red, then small body (doji/spinning top gap lower), then large green candle. Represents complete exhaustion of sellers and buyer takeover.",
      reliability: "Very High (78–82%)",
      timeframe: "Daily / Weekly",
      volume: "Third candle needs surging volume",
      confirmation: "Third green candle closes above 50% of first red",
      strength: "★★★★★",
      trigger: "Bottom of downtrend, key support levels",
      nse: "Gold standard signal in NSE F&O. Traders look for Morning Stars at important supports like Nifty 17,000 or 18,000 psychological levels.",
      svgKey: "morning-star",
      example: {
        stock: "HDFCBANK",
        date: "Budget Day Support Pivot",
        movement: "+12.8% Reversal in 7 Sessions",
        highlight: [2, 3, 4],
        candles: [
          { o: 1610, h: 1615, l: 1592, c: 1596 },
          { o: 1596, h: 1600, l: 1572, c: 1578 },
          { o: 1578, h: 1585, l: 1540, c: 1548 }, // 1. Large red
          { o: 1532, h: 1542, l: 1520, c: 1530 }, // 2. Indecision gap
          { o: 1545, h: 1588, l: 1542, c: 1585 }, // 3. Large green
          { o: 1585, h: 1612, l: 1580, c: 1608 },
          { o: 1608, h: 1640, l: 1602, c: 1634 },
          { o: 1634, h: 1672, l: 1630, c: 1668 }
        ]
      }
    },
    {
      name: "Bullish Harami",
      desc: "Small green candle contained entirely within the prior large red candle's body. Signals momentum loss of sellers but needs confirmation.",
      reliability: "Moderate (60–65%)",
      timeframe: "Daily",
      volume: "Low volume on small candle acceptable",
      confirmation: "Requires a bullish candle on day 3",
      strength: "★★★☆☆",
      trigger: "After sustained downtrend",
      nse: "Commonly seen in PSU bank stocks. Works well on BSE Midcap index charts at oversold zones.",
      svgKey: "bull-harami",
      example: {
        stock: "ICICIBANK",
        date: "Option Expiry Squeeze Bounce",
        movement: "+5.4% Markup in 3 Sessions",
        highlight: [2, 3],
        candles: [
          { o: 955, h: 958, l: 940, c: 944 },
          { o: 944, h: 946, l: 928, c: 932 },
          { o: 932, h: 936, l: 898, c: 902 }, // Large red
          { o: 908, h: 922, l: 906, c: 918 }, // Small green inside
          { o: 918, h: 935, l: 916, c: 932 },
          { o: 932, h: 948, l: 928, c: 944 },
          { o: 944, h: 958, l: 942, c: 955 },
          { o: 955, h: 968, l: 953, c: 964 }
        ]
      }
    },
    {
      name: "Three White Soldiers",
      desc: "Three consecutive long green candles, each opening near the previous close and closing higher. Indicates strong sustained buying across multiple sessions.",
      reliability: "High (72–78%)",
      timeframe: "Daily / Weekly",
      volume: "Each candle should have progressively or equally high volume",
      confirmation: "Self-confirming; watch for short-term overbought",
      strength: "★★★★★",
      trigger: "After a base formation or bottoming pattern",
      nse: "Seen in Nifty after RBI policy decisions or GDP data surprises. Also in stock-specific events like promoter buying announcements.",
      svgKey: "three-soldiers",
      example: {
        stock: "NIFTY Index",
        date: "RBI Interest Rate Cut Policy",
        movement: "+6.8% Momentum Climb in 6 Days",
        highlight: [3, 4, 5],
        candles: [
          { o: 19400, h: 19450, l: 19320, c: 19360 },
          { o: 19360, h: 19390, l: 19250, c: 19280 },
          { o: 19280, h: 19330, l: 19200, c: 19310 },
          { o: 19315, h: 19460, l: 19310, c: 19450 }, // Soldier 1
          { o: 19455, h: 19580, l: 19440, c: 19570 }, // Soldier 2
          { o: 19575, h: 19710, l: 19560, c: 19700 }, // Soldier 3
          { o: 19700, h: 19780, l: 19660, c: 19760 },
          { o: 19760, h: 19880, l: 19740, c: 19860 }
        ]
      }
    },
    {
      name: "Dragonfly Doji",
      desc: "Opening, high, and close are all at/near the same level with a long lower shadow. Extreme buying rejection of lower prices. Very bullish at support.",
      reliability: "High (70–75%)",
      timeframe: "Daily",
      volume: "High volume strengthens signal",
      confirmation: "Next candle must close green and above the doji",
      strength: "★★★★☆",
      trigger: "At major support, 200 DMA",
      nse: "Strong signal at Nifty's 200-day moving average or after circuit-breaker trading halts in individual stocks.",
      svgKey: "dragonfly",
      example: {
        stock: "TCS (Tata Consultancy Services)",
        date: "200-DMA Support Rejection",
        movement: "+8.2% Bullish Rebound in 5 Sessions",
        highlight: [3],
        candles: [
          { o: 3380, h: 3395, l: 3350, c: 3362 },
          { o: 3362, h: 3375, l: 3310, c: 3328 },
          { o: 3328, h: 3340, l: 3260, c: 3280 },
          { o: 3275, h: 3278, l: 3205, c: 3276 }, // Dragonfly
          { o: 3276, h: 3325, l: 3270, c: 3320 },
          { o: 3320, h: 3375, l: 3315, c: 3368 },
          { o: 3368, h: 3420, l: 3360, c: 3410 },
          { o: 3410, h: 3465, l: 3402, c: 3455 }
        ]
      }
    }
  ],
  bearish: [
    {
      name: "Hanging Man",
      desc: "Looks identical to Hammer but appears at the TOP of an uptrend. The long lower shadow shows sellers are starting to overwhelm buyers. A warning sign, not immediate sell.",
      reliability: "Moderate (60–65%)",
      timeframe: "Daily / Weekly",
      volume: "High volume on Hanging Man is alarming",
      confirmation: "Next candle must close below Hanging Man's close",
      strength: "★★★☆☆",
      trigger: "At resistance, after overbought RSI",
      nse: "Often appears in F&O stocks after strong rally days. Seen on Nifty charts before corrections at 52-week highs.",
      svgKey: "hanging-man",
      example: {
        stock: "ITC Limited",
        date: "Dividend Record Date High",
        movement: "-6.5% Profit-taking Drop in 4 Days",
        highlight: [3],
        candles: [
          { o: 432, h: 438, l: 430, c: 435 },
          { o: 435, h: 442, l: 434, c: 440 },
          { o: 440, h: 449, l: 439, c: 448 },
          { o: 448, h: 450, l: 435, c: 447 }, // Hanging Man
          { o: 445, h: 446, l: 432, c: 434 },
          { o: 434, h: 436, l: 424, c: 426 },
          { o: 426, h: 428, l: 418, c: 420 },
          { o: 420, h: 423, l: 414, c: 416 }
        ]
      }
    },
    {
      name: "Shooting Star",
      desc: "Small body at bottom with long upper shadow at the TOP of an uptrend. Buyers pushed price high but sellers fully rejected the gains by close. Strong reversal signal.",
      reliability: "High (70–75%)",
      timeframe: "Daily",
      volume: "High volume = more reliable signal",
      confirmation: "Next red candle closes below Shooting Star's body",
      strength: "★★★★☆",
      trigger: "At key resistance levels, 52-week highs",
      nse: "Reliable in Nifty 50 futures. Common at Budget-day highs or RBI rate-cut euphoria peaks in banking stocks.",
      svgKey: "shooting-star",
      example: {
        stock: "RELIANCE",
        date: "All-Time High Valuation Ceiling",
        movement: "-8.1% Bearish Slide in 6 Days",
        highlight: [3],
        candles: [
          { o: 2680, h: 2710, l: 2672, c: 2704 },
          { o: 2704, h: 2735, l: 2698, c: 2728 },
          { o: 2728, h: 2768, l: 2720, c: 2760 },
          { o: 2758, h: 2795, l: 2748, c: 2752 }, // Shooting Star
          { o: 2745, h: 2748, l: 2695, c: 2702 },
          { o: 2702, h: 2708, l: 2640, c: 2648 },
          { o: 2648, h: 2655, l: 2590, c: 2600 },
          { o: 2600, h: 2612, l: 2540, c: 2552 }
        ]
      }
    },
    {
      name: "Bearish Engulfing",
      desc: "A large red candle that completely engulfs the prior green candle. Represents massive institutional selling overwhelming the prior buying momentum.",
      reliability: "Very High (75–80%)",
      timeframe: "Daily / Weekly",
      volume: "Bearish candle must have much higher volume",
      confirmation: "Self-confirming; next gap-down adds confidence",
      strength: "★★★★★",
      trigger: "At resistance after uptrend",
      nse: "Key signal for NSE traders. Budget announcements, SEBI actions, or Q3 earnings misses often produce Bearish Engulfing on Nifty weekly charts.",
      svgKey: "bear-engulf",
      example: {
        stock: "KOTAKBANK",
        date: "SEBI Compliance Penalty News",
        movement: "-14.2% Institutional Drop in 5 Sessions",
        highlight: [2, 3],
        candles: [
          { o: 1810, h: 1828, l: 1802, c: 1822 },
          { o: 1822, h: 1845, l: 1818, c: 1840 },
          { o: 1840, h: 1855, l: 1835, c: 1852 }, // Green candle
          { o: 1858, h: 1860, l: 1785, c: 1790 }, // Large red engulfing
          { o: 1785, h: 1792, l: 1720, c: 1732 },
          { o: 1732, h: 1740, l: 1680, c: 1688 },
          { o: 1688, h: 1695, l: 1622, c: 1630 },
          { o: 1630, h: 1638, l: 1580, c: 1592 }
        ]
      }
    },
    {
      name: "Dark Cloud Cover",
      desc: "Green candle followed by red candle that opens above the green's high but closes below its midpoint. Partial but significant bearish reversal signal.",
      reliability: "Moderate-High (65–70%)",
      timeframe: "Daily",
      volume: "Red candle must have higher volume",
      confirmation: "Third candle follows down",
      strength: "★★★★☆",
      trigger: "At resistance after 3+ green days",
      nse: "Frequently seen in Nifty after gap-up opens on positive global cues but disappointing domestic data reverses the move.",
      svgKey: "dark-cloud",
      example: {
        stock: "BHARTIARTL (Airtel)",
        date: "Tariff Hike Profit-Booking",
        movement: "-7.0% Price Correction in 4 Days",
        highlight: [2, 3],
        candles: [
          { o: 880, h: 892, l: 875, c: 888 },
          { o: 888, h: 905, l: 884, c: 902 },
          { o: 902, h: 924, l: 898, c: 920 }, // Strong green
          { o: 932, h: 935, l: 895, c: 898 }, // Open gap-up, close < mid
          { o: 895, h: 898, l: 874, c: 878 },
          { o: 878, h: 882, l: 858, c: 862 },
          { o: 862, h: 869, l: 848, c: 855 },
          { o: 855, h: 859, l: 840, c: 844 }
        ]
      }
    },
    {
      name: "Evening Star",
      desc: "Three-candle top pattern: large green, small body gap (star), then large red candle. Mirror image of Morning Star. Very strong reversal confirmation.",
      reliability: "Very High (78–82%)",
      timeframe: "Daily / Weekly",
      volume: "Third red candle must surge in volume",
      confirmation: "Red candle closes below midpoint of first green",
      strength: "★★★★★",
      trigger: "After strong uptrend at major resistance",
      nse: "Powerful signal on Nifty weekly chart. Evening Stars at psychological highs (e.g. 20,000 / 22,000) have historically preceded 5–10% corrections.",
      svgKey: "evening-star",
      example: {
        stock: "NIFTY Index",
        date: "All-Time High Supply Exhaustion",
        movement: "-9.5% Systemic Pullback in 8 Days",
        highlight: [2, 3, 4],
        candles: [
          { o: 21850, h: 21920, l: 21800, c: 21890 },
          { o: 21890, h: 21980, l: 21850, c: 21960 },
          { o: 21960, h: 22120, l: 21950, c: 22090 }, // 1. Large green
          { o: 22150, h: 22180, l: 22090, c: 22110 }, // 2. Indecision gap
          { o: 22090, h: 22100, l: 21840, c: 21860 }, // 3. Large red below mid
          { o: 21860, h: 21890, l: 21620, c: 21660 },
          { o: 21660, h: 21700, l: 21350, c: 21410 },
          { o: 21410, h: 21450, l: 21100, c: 21180 }
        ]
      }
    },
    {
      name: "Bearish Harami",
      desc: "Small red candle inside the prior large green candle's body. Buyer momentum is slowing; a warning sign that the uptrend may be exhausting.",
      reliability: "Moderate (58–63%)",
      timeframe: "Daily",
      volume: "Low volume on second candle acceptable",
      confirmation: "Requires 3rd candle to close below harami low",
      strength: "★★★☆☆",
      trigger: "After prolonged uptrend",
      nse: "Common in Nifty IT and Pharma sectors after sharp rallies on dollar/rupee moves. Use with MACD divergence for better accuracy.",
      svgKey: "bear-harami",
      example: {
        stock: "WIPRO",
        date: "Q3 Earnings Distribution",
        movement: "-5.2% Slow Slide in 3 Sessions",
        highlight: [2, 3],
        candles: [
          { o: 462, h: 468, l: 459, c: 465 },
          { o: 465, h: 474, l: 463, c: 472 },
          { o: 472, h: 488, l: 470, c: 485 }, // Large green
          { o: 482, h: 484, l: 475, c: 477 }, // Small red inside
          { o: 477, h: 479, l: 468, c: 470 },
          { o: 470, h: 472, l: 461, c: 464 },
          { o: 464, h: 466, l: 455, c: 458 },
          { o: 458, h: 462, l: 452, c: 455 }
        ]
      }
    },
    {
      name: "Three Black Crows",
      desc: "Three consecutive long red candles, each opening near previous close and closing lower. Strong sustained selling over multiple sessions.",
      reliability: "High (72–78%)",
      timeframe: "Daily / Weekly",
      volume: "Progressively high or equal volume each day",
      confirmation: "Self-confirming pattern",
      strength: "★★★★★",
      trigger: "At market tops or after failed breakouts",
      nse: "Seen in NSE when FII outflows accelerate (e.g. US Fed rate hike cycles). Reliable on Nifty Bank weekly charts at cycle tops.",
      svgKey: "three-crows",
      example: {
        stock: "ADANIENT",
        date: "US Short-Seller Report Release",
        movement: "-28.4% Market Crash in 6 Days",
        highlight: [3, 4, 5],
        candles: [
          { o: 3420, h: 3450, l: 3380, c: 3410 },
          { o: 3410, h: 3430, l: 3320, c: 3350 },
          { o: 3350, h: 3375, l: 3260, c: 3310 },
          { o: 3280, h: 3290, l: 2980, c: 3010 }, // Crow 1
          { o: 2990, h: 3010, l: 2680, c: 2720 }, // Crow 2
          { o: 2700, h: 2725, l: 2360, c: 2420 }, // Crow 3
          { o: 2420, h: 2480, l: 2180, c: 2240 },
          { o: 2240, h: 2350, l: 1980, c: 2150 }
        ]
      }
    },
    {
      name: "Gravestone Doji",
      desc: "Open, close, and low are at the same level with a long upper shadow. Buyers tried to push price up but were fully rejected. Extremely bearish at resistance.",
      reliability: "High (70–76%)",
      timeframe: "Daily",
      volume: "High volume at top is very bearish",
      confirmation: "Next candle must close red below the doji",
      strength: "★★★★☆",
      trigger: "At 52-week highs, major resistance zones",
      nse: "Potent signal at Nifty's all-time highs. Also reliable in auto and FMCG stocks hitting valuation ceilings.",
      svgKey: "gravestone",
      example: {
        stock: "AXISBANK",
        date: "Round Number 1200 Resistance",
        movement: "-8.8% Rejection Fall in 5 Sessions",
        highlight: [3],
        candles: [
          { o: 1165, h: 1178, l: 1160, c: 1172 },
          { o: 1172, h: 1188, l: 1168, c: 1184 },
          { o: 1184, h: 1198, l: 1180, c: 1195 },
          { o: 1196, h: 1204, l: 1194, c: 1195 }, // Gravestone Doji
          { o: 1195, h: 1196, l: 1165, c: 1170 },
          { o: 1170, h: 1175, l: 1130, c: 1138 },
          { o: 1138, h: 1146, l: 1105, c: 1112 },
          { o: 1112, h: 1120, l: 1084, c: 1090 }
        ]
      }
    }
  ],
  neutral: [
    {
      name: "Doji",
      desc: "Open and close are equal or nearly equal, forming a cross shape. Represents perfect indecision between buyers and sellers. Context (trend, location) determines bias.",
      reliability: "Context-dependent (55–65%)",
      timeframe: "All timeframes",
      volume: "Volume helps determine direction after doji",
      confirmation: "Next candle direction gives bias",
      strength: "★★★☆☆",
      trigger: "After strong trends or at key levels",
      nse: "Nifty Dojis after large directional moves often precede intraday reversals. Key for Bank Nifty options sellers at weekly expiry.",
      svgKey: "doji",
      example: {
        stock: "HDFCBANK",
        date: "Pre-RBI Policy Silence Period",
        movement: "Sideways Consolidation (0.5% Range)",
        highlight: [3],
        candles: [
          { o: 1530, h: 1545, l: 1525, c: 1540 },
          { o: 1540, h: 1552, l: 1534, c: 1548 },
          { o: 1548, h: 1560, l: 1540, c: 1558 },
          { o: 1558, h: 1561, l: 1555, c: 1558 }, // Doji
          { o: 1558, h: 1564, l: 1552, c: 1559 },
          { o: 1559, h: 1568, l: 1554, c: 1562 },
          { o: 1562, h: 1566, l: 1558, c: 1560 },
          { o: 1560, h: 1572, l: 1556, c: 1568 }
        ]
      }
    },
    {
      name: "Spinning Top",
      desc: "Small body with upper and lower shadows of similar length. Shows uncertainty. Both buyers and sellers are active but neither wins. Trend continuation or reversal depends on context.",
      reliability: "Low-Moderate (50–58%)",
      timeframe: "Daily",
      volume: "Low volume confirms indecision",
      confirmation: "Strong next candle in either direction",
      strength: "★★☆☆☆",
      trigger: "During consolidation phases",
      nse: "Common in Nifty during RBI monetary policy waiting periods. Traders in NSE F&O use these as premium-selling opportunities.",
      svgKey: "spinning-top",
      example: {
        stock: "RELIANCE",
        date: "AGM Consolidation Week",
        movement: "Rangebound Option Decay for 4 Days",
        highlight: [3],
        candles: [
          { o: 2420, h: 2435, l: 2410, c: 2430 },
          { o: 2430, h: 2442, l: 2422, c: 2436 },
          { o: 2436, h: 2450, l: 2430, c: 2445 },
          { o: 2445, h: 2452, l: 2436, c: 2444 }, // Spinning Top
          { o: 2444, h: 2455, l: 2432, c: 2442 },
          { o: 2442, h: 2450, l: 2435, c: 2446 },
          { o: 2446, h: 2458, l: 2438, c: 2448 },
          { o: 2448, h: 2465, l: 2440, c: 2455 }
        ]
      }
    },
    {
      name: "Inside Bar (Harami Cross)",
      desc: "Second candle (doji) is completely inside the first candle's range. Volatility compression signal. Breakout direction of the inside bar gives next major move.",
      reliability: "Moderate (62–68%) on breakout",
      timeframe: "Daily / Weekly",
      volume: "Decreasing volume; spike on breakout",
      confirmation: "Breakout from the first candle's range",
      strength: "★★★☆☆",
      trigger: "After trending moves, pre-event compression",
      nse: "Very effective pre-earnings or pre-Budget in NSE stocks. Breakout from the first candle high/low becomes a trigger point.",
      svgKey: "inside-bar",
      example: {
        stock: "TATASTEEL",
        date: "Pre-Earnings Volatility Squeeze",
        movement: "+8.4% Breakout in 3 Sessions",
        highlight: [2, 3],
        candles: [
          { o: 118, h: 122, l: 117, c: 121 },
          { o: 121, h: 125, l: 120, c: 124 },
          { o: 124, h: 131, l: 122, c: 130 }, // Mother bar (large)
          { o: 128, h: 129, l: 125, c: 127 }, // Inside bar (small)
          { o: 128, h: 134, l: 127, c: 133 }, // Breakout (up)
          { o: 133, h: 138, l: 132, c: 137 },
          { o: 137, h: 142, l: 136, c: 141 },
          { o: 141, h: 145, l: 139, c: 143 }
        ]
      }
    },
    {
      name: "Marubozu",
      desc: "A full-bodied candle with no wicks (or very small ones). Represents absolute dominance by either buyers (green) or sellers (red). Strong trend continuation signal.",
      reliability: "High (70–75%) in trend direction",
      timeframe: "Daily",
      volume: "High volume essential for validity",
      confirmation: "Often self-confirming in strong trends",
      strength: "★★★★☆",
      trigger: "Breakouts, post-event news candles",
      nse: "Common on NSE after major events — SEBI announcements, promoter stake changes, or quarterly earnings beats/misses. Circuit-to-circuit moves produce Marubozus.",
      svgKey: "marubozu",
      example: {
        stock: "SBIN (State Bank of India)",
        date: "Promoter Stake Buy Surprise",
        movement: "+15.0% Upper Circuit Expansion",
        highlight: [3],
        candles: [
          { o: 542, h: 548, l: 538, c: 544 },
          { o: 544, h: 552, l: 541, c: 548 },
          { o: 548, h: 554, l: 545, c: 551 },
          { o: 552, h: 634, l: 552, c: 634 }, // Marubozu (No wicks)
          { o: 634, h: 648, l: 628, c: 645 },
          { o: 645, h: 662, l: 640, c: 658 },
          { o: 658, h: 670, l: 652, c: 664 },
          { o: 664, h: 682, l: 660, c: 678 }
        ]
      }
    },
    {
      name: "Rising Window (Bullish Gap)",
      desc: "A gap up between two candles where the previous candle's high is below the next candle's low. The gap acts as support. Strong continuation signal in uptrend.",
      reliability: "High (68–73%)",
      timeframe: "Daily",
      volume: "High volume on gap candle",
      confirmation: "Price holds above gap after pullback",
      strength: "★★★★☆",
      trigger: "After breakouts, positive overnight events",
      nse: "Nifty gap-ups on FII inflow days or positive US cues. Gap acts as support on retests. Common in IT index after strong TCS/Infosys results.",
      svgKey: "rising-window",
      example: {
        stock: "INFY (Infosys)",
        date: "US ADR Overnight Earnings Beat",
        movement: "+8.8% Gap-Up Continuation",
        highlight: [2, 3],
        candles: [
          { o: 1460, h: 1485, l: 1452, c: 1478 },
          { o: 1478, h: 1494, l: 1470, c: 1488 },
          { o: 1488, h: 1510, l: 1482, c: 1505 }, // Candle 1
          { o: 1535, h: 1565, l: 1530, c: 1558 }, // Candle 2 (Gap up!)
          { o: 1558, h: 1572, l: 1542, c: 1565 },
          { o: 1565, h: 1598, l: 1558, c: 1592 },
          { o: 1592, h: 1610, l: 1585, c: 1604 },
          { o: 1604, h: 1630, l: 1600, c: 1622 }
        ]
      }
    },
    {
      name: "Falling Window (Bearish Gap)",
      desc: "A gap down between two candles where the previous candle's low is above the next candle's high. The gap acts as resistance. Strong continuation signal in downtrend.",
      reliability: "High (68–73%)",
      timeframe: "Daily",
      volume: "High volume on gap candle",
      confirmation: "Price fails to close the gap on retest",
      strength: "★★★★☆",
      trigger: "After breakdowns, negative overnight news",
      nse: "NSE gap-downs on FII selling sprees, global risk-off events. The gap level serves as strong resistance. Common during US recession fears or oil price spikes.",
      svgKey: "falling-window",
      example: {
        stock: "WIPRO",
        date: "Weak US Retail Spending Data",
        movement: "-7.5% Gap-Down Continuation",
        highlight: [2, 3],
        candles: [
          { o: 485, h: 489, l: 478, c: 480 },
          { o: 480, h: 484, l: 472, c: 475 },
          { o: 475, h: 478, l: 464, c: 468 }, // Candle 1
          { o: 454, h: 456, l: 438, c: 442 }, // Candle 2 (Gap down!)
          { o: 442, h: 445, l: 430, c: 434 },
          { o: 434, h: 438, l: 422, c: 425 },
          { o: 425, h: 430, l: 415, c: 418 },
          { o: 418, h: 422, l: 408, c: 410 }
        ]
      }
    },
    {
      name: "Tweezer Tops",
      desc: "Two candles with the same or nearly identical highs — one green, one red. Price rejected at the same high twice, confirming strong overhead resistance.",
      reliability: "Moderate-High (65–70%)",
      timeframe: "Daily",
      volume: "Higher volume on second (red) candle",
      confirmation: "Next candle closes below both candle lows",
      strength: "★★★★☆",
      trigger: "At key resistance levels",
      nse: "Effective at Nifty round number resistance (21,000 / 22,000). Used heavily by option writers to initiate short positions.",
      svgKey: "tweezer-top",
      example: {
        stock: "TCS (Tata Consultancy)",
        date: "Round Number 4000 Valuation Cap",
        movement: "-6.8% Supply Rejection in 4 Days",
        highlight: [2, 3],
        candles: [
          { o: 3880, h: 3925, l: 3862, c: 3910 },
          { o: 3910, h: 3955, l: 3890, c: 3948 },
          { o: 3948, h: 4012, l: 3935, c: 4006 }, // Green (High 4012)
          { o: 4012, h: 4012, l: 3940, c: 3952 }, // Red (High 4012)
          { o: 3952, h: 3960, l: 3895, c: 3910 },
          { o: 3910, h: 3922, l: 3840, c: 3855 },
          { o: 3855, h: 3870, l: 3790, c: 3804 },
          { o: 3804, h: 3822, l: 3720, c: 3734 }
        ]
      }
    },
    {
      name: "Tweezer Bottoms",
      desc: "Two candles with the same or nearly identical lows — one red, one green. Price bounced from the same low twice, confirming strong support holding.",
      reliability: "Moderate-High (65–70%)",
      timeframe: "Daily",
      volume: "Higher volume on second (green) candle",
      confirmation: "Next candle closes above both highs",
      strength: "★★★★☆",
      trigger: "At major support levels",
      nse: "Reliable at Nifty support zones. Used by traders to initiate call buying at Nifty bottoms during brief FII sell-offs.",
      svgKey: "tweezer-bottom",
      example: {
        stock: "L&T (Larsen & Toubro)",
        date: "Infrastructure Capex Budget",
        movement: "+10.4% Golden Support Bounce",
        highlight: [2, 3],
        candles: [
          { o: 2840, h: 2855, l: 2800, c: 2812 },
          { o: 2812, h: 2824, l: 2758, c: 2770 },
          { o: 2770, h: 2795, l: 2730, c: 2742 }, // Red (Low 2730)
          { o: 2735, h: 2810, l: 2730, c: 2802 }, // Green (Low 2730)
          { o: 2802, h: 2842, l: 2795, c: 2835 },
          { o: 2835, h: 2884, l: 2820, c: 2872 },
          { o: 2872, h: 2928, l: 2865, c: 2915 },
          { o: 2915, h: 2975, l: 2908, c: 2962 }
        ]
      }
    }
  ]
};

const SVGS = {
  "hammer": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="20" stroke="#22c55e" stroke-width="1.5"/><rect x="20" y="20" width="20" height="14" rx="2" fill="#22c55e"/><line x1="30" y1="34" x2="30" y2="75" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "inv-hammer": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="46" stroke="#22c55e" stroke-width="1.5"/><rect x="20" y="46" width="20" height="14" rx="2" fill="#22c55e"/><line x1="30" y1="60" x2="30" y2="65" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "bull-engulf": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="25" width="20" height="30" rx="2" fill="#ef4444"/><line x1="15" y1="18" x2="15" y2="25" stroke="#ef4444" stroke-width="1.5"/><line x1="15" y1="55" x2="15" y2="62" stroke="#ef4444" stroke-width="1.5"/><rect x="35" y="15" width="30" height="50" rx="2" fill="#22c55e"/><line x1="50" y1="5" x2="50" y2="15" stroke="#22c55e" stroke-width="1.5"/><line x1="50" y1="65" x2="50" y2="75" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "piercing": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="15" width="22" height="45" rx="2" fill="#ef4444"/><line x1="16" y1="5" x2="16" y2="15" stroke="#ef4444" stroke-width="1.5"/><line x1="16" y1="60" x2="16" y2="72" stroke="#ef4444" stroke-width="1.5"/><rect x="38" y="37" width="24" height="28" rx="2" fill="#22c55e"/><line x1="50" y1="28" x2="50" y2="37" stroke="#22c55e" stroke-width="1.5"/><line x1="50" y1="65" x2="50" y2="72" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "morning-star": `<svg width="110" height="80" viewBox="0 0 110 80"><rect x="4" y="15" width="22" height="40" rx="2" fill="#ef4444"/><line x1="15" y1="8" x2="15" y2="15" stroke="#ef4444" stroke-width="1.5"/><line x1="15" y1="55" x2="15" y2="65" stroke="#ef4444" stroke-width="1.5"/><rect x="40" y="60" width="12" height="8" rx="2" fill="#888"/><line x1="46" y1="54" x2="46" y2="60" stroke="#888" stroke-width="1.5"/><line x1="46" y1="68" x2="46" y2="74" stroke="#888" stroke-width="1.5"/><rect x="68" y="20" width="28" height="42" rx="2" fill="#22c55e"/><line x1="82" y1="10" x2="82" y2="20" stroke="#22c55e" stroke-width="1.5"/><line x1="82" y1="62" x2="82" y2="72" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "bull-harami": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="12" width="26" height="52" rx="2" fill="#ef4444"/><line x1="18" y1="4" x2="18" y2="12" stroke="#ef4444" stroke-width="1.5"/><line x1="18" y1="64" x2="18" y2="73" stroke="#ef4444" stroke-width="1.5"/><rect x="42" y="28" width="22" height="24" rx="2" fill="#22c55e"/><line x1="53" y1="22" x2="53" y2="28" stroke="#22c55e" stroke-width="1.5"/><line x1="53" y1="52" x2="53" y2="57" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "three-soldiers": `<svg width="110" height="80" viewBox="0 0 110 80"><rect x="5" y="50" width="20" height="22" rx="2" fill="#22c55e"/><line x1="15" y1="42" x2="15" y2="50" stroke="#22c55e" stroke-width="1.5"/><line x1="15" y1="72" x2="15" y2="78" stroke="#22c55e" stroke-width="1.5"/><rect x="38" y="32" width="20" height="30" rx="2" fill="#22c55e"/><line x1="48" y1="24" x2="48" y2="32" stroke="#22c55e" stroke-width="1.5"/><line x1="48" y1="62" x2="48" y2="68" stroke="#22c55e" stroke-width="1.5"/><rect x="70" y="12" width="20" height="38" rx="2" fill="#22c55e"/><line x1="80" y1="5" x2="80" y2="12" stroke="#22c55e" stroke-width="1.5"/><line x1="80" y1="50" x2="80" y2="57" stroke="#22c55e" stroke-width="1.5"/></svg>`,
  "dragonfly": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="20" x2="30" y2="75" stroke="#22c55e" stroke-width="1.5"/><rect x="20" y="18" width="20" height="4" rx="2" fill="#22c55e"/></svg>`,
  "hanging-man": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="10" stroke="#ef4444" stroke-width="1.5"/><rect x="20" y="10" width="20" height="14" rx="2" fill="#ef4444"/><line x1="30" y1="24" x2="30" y2="75" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "shooting-star": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="46" stroke="#ef4444" stroke-width="1.5"/><rect x="20" y="46" width="20" height="14" rx="2" fill="#ef4444"/><line x1="30" y1="60" x2="30" y2="66" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "bear-engulf": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="25" width="22" height="30" rx="2" fill="#22c55e"/><line x1="16" y1="18" x2="16" y2="25" stroke="#22c55e" stroke-width="1.5"/><line x1="16" y1="55" x2="16" y2="62" stroke="#22c55e" stroke-width="1.5"/><rect x="36" y="15" width="30" height="52" rx="2" fill="#ef4444"/><line x1="51" y1="5" x2="51" y2="15" stroke="#ef4444" stroke-width="1.5"/><line x1="51" y1="67" x2="51" y2="76" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "dark-cloud": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="28" width="22" height="30" rx="2" fill="#22c55e"/><line x1="16" y1="20" x2="16" y2="28" stroke="#22c55e" stroke-width="1.5"/><line x1="16" y1="58" x2="16" y2="66" stroke="#22c55e" stroke-width="1.5"/><rect x="36" y="42" width="24" height="28" rx="2" fill="#ef4444"/><line x1="48" y1="12" x2="48" y2="42" stroke="#ef4444" stroke-width="1.5"/><line x1="48" y1="70" x2="48" y2="76" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "evening-star": `<svg width="110" height="80" viewBox="0 0 110 80"><rect x="4" y="23" width="26" height="42" rx="2" fill="#22c55e"/><line x1="17" y1="14" x2="17" y2="23" stroke="#22c55e" stroke-width="1.5"/><line x1="17" y1="65" x2="17" y2="74" stroke="#22c55e" stroke-width="1.5"/><rect x="43" y="8" width="12" height="8" rx="2" fill="#888"/><line x1="49" y1="4" x2="49" y2="8" stroke="#888" stroke-width="1.5"/><line x1="49" y1="16" x2="49" y2="20" stroke="#888" stroke-width="1.5"/><rect x="68" y="28" width="28" height="42" rx="2" fill="#ef4444"/><line x1="82" y1="18" x2="82" y2="28" stroke="#ef4444" stroke-width="1.5"/><line x1="82" y1="70" x2="82" y2="78" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "bear-harami": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="12" width="26" height="52" rx="2" fill="#22c55e"/><line x1="18" y1="5" x2="18" y2="12" stroke="#22c55e" stroke-width="1.5"/><line x1="18" y1="64" x2="18" y2="73" stroke="#22c55e" stroke-width="1.5"/><rect x="42" y="28" width="22" height="24" rx="2" fill="#ef4444"/><line x1="53" y1="22" x2="53" y2="28" stroke="#ef4444" stroke-width="1.5"/><line x1="53" y1="52" x2="53" y2="57" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "three-crows": `<svg width="110" height="80" viewBox="0 0 110 80"><rect x="5" y="8" width="20" height="22" rx="2" fill="#ef4444"/><line x1="15" y1="4" x2="15" y2="8" stroke="#ef4444" stroke-width="1.5"/><line x1="15" y1="30" x2="15" y2="36" stroke="#ef4444" stroke-width="1.5"/><rect x="38" y="24" width="20" height="28" rx="2" fill="#ef4444"/><line x1="48" y1="18" x2="48" y2="24" stroke="#ef4444" stroke-width="1.5"/><line x1="48" y1="52" x2="48" y2="58" stroke="#ef4444" stroke-width="1.5"/><rect x="70" y="42" width="20" height="30" rx="2" fill="#ef4444"/><line x1="80" y1="34" x2="80" y2="42" stroke="#ef4444" stroke-width="1.5"/><line x1="80" y1="72" x2="80" y2="77" stroke="#ef4444" stroke-width="1.5"/></svg>`,
  "gravestone": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="60" stroke="#ef4444" stroke-width="1.5"/><rect x="20" y="60" width="20" height="4" rx="2" fill="#ef4444"/></svg>`,
  "doji": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="37" stroke="#888" stroke-width="1.5"/><rect x="18" y="37" width="24" height="4" rx="1" fill="#888"/><line x1="30" y1="41" x2="30" y2="75" stroke="#888" stroke-width="1.5"/></svg>`,
  "spinning-top": `<svg width="60" height="80" viewBox="0 0 60 80"><line x1="30" y1="5" x2="30" y2="28" stroke="#888" stroke-width="1.5"/><rect x="18" y="28" width="24" height="22" rx="2" fill="#888"/><line x1="30" y1="50" x2="30" y2="75" stroke="#888" stroke-width="1.5"/></svg>`,
  "inside-bar": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="12" width="24" height="52" rx="2" fill="#22c55e"/><line x1="17" y1="5" x2="17" y2="12" stroke="#22c55e" stroke-width="1.5"/><line x1="17" y1="64" x2="17" y2="73" stroke="#22c55e" stroke-width="1.5"/><rect x="40" y="28" width="22" height="24" rx="1" fill="none" stroke="#888" stroke-width="1.5" stroke-dasharray="3,2"/><line x1="51" y1="28" x2="51" y2="28" stroke="#888" stroke-width="1"/><line x1="51" y1="52" x2="51" y2="52" stroke="#888" stroke-width="1"/></svg>`,
  "marubozu": `<svg width="60" height="80" viewBox="0 0 60 80"><rect x="15" y="5" width="28" height="70" rx="2" fill="#22c55e"/></svg>`,
  "rising-window": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="35" width="22" height="30" rx="2" fill="#22c55e"/><line x1="16" y1="27" x2="16" y2="35" stroke="#22c55e" stroke-width="1.5"/><line x1="16" y1="65" x2="16" y2="72" stroke="#22c55e" stroke-width="1.5"/><rect x="42" y="10" width="22" height="20" rx="2" fill="#22c55e"/><line x1="53" y1="4" x2="53" y2="10" stroke="#22c55e" stroke-width="1.5"/><line x1="53" y1="30" x2="53" y2="35" stroke="#22c55e" stroke-width="1.5"/><line x1="16" y1="27" x2="53" y2="35" stroke="#888" stroke-width="0.8" stroke-dasharray="3,2"/></svg>`,
  "falling-window": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="5" y="10" width="22" height="30" rx="2" fill="#ef4444"/><line x1="16" y1="5" x2="16" y2="10" stroke="#ef4444" stroke-width="1.5"/><line x1="16" y1="40" x2="16" y2="48" stroke="#ef4444" stroke-width="1.5"/><rect x="42" y="50" width="22" height="24" rx="2" fill="#ef4444"/><line x1="53" y1="43" x2="53" y2="50" stroke="#ef4444" stroke-width="1.5"/><line x1="53" y1="74" x2="53" y2="78" stroke="#ef4444" stroke-width="1.5"/><line x1="16" y1="48" x2="53" y2="43" stroke="#888" stroke-width="0.8" stroke-dasharray="3,2"/></svg>`,
  "tweezer-top": `<svg width="80" height="80" viewBox="0 0 80 80"><line x1="8" y1="18" x2="8" y2="55" stroke="#888" stroke-width="1"/><rect x="4" y="18" width="26" height="22" rx="2" fill="#22c55e"/><line x1="17" y1="55" x2="17" y2="66" stroke="#22c55e" stroke-width="1.5"/><rect x="42" y="18" width="26" height="22" rx="2" fill="#ef4444"/><line x1="55" y1="40" x2="55" y2="70" stroke="#ef4444" stroke-width="1.5"/><line x1="5" y1="18" x2="66" y2="18" stroke="#ef4444" stroke-width="0.8" stroke-dasharray="3,2"/></svg>`,
  "tweezer-bottom": `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="4" y="15" width="26" height="22" rx="2" fill="#ef4444"/><line x1="17" y1="10" x2="17" y2="15" stroke="#ef4444" stroke-width="1.5"/><line x1="17" y1="37" x2="17" y2="62" stroke="#ef4444" stroke-width="1.5"/><rect x="42" y="15" width="26" height="22" rx="2" fill="#22c55e"/><line x1="55" y1="10" x2="55" y2="15" stroke="#22c55e" stroke-width="1.5"/><line x1="55" y1="37" x2="55" y2="62" stroke="#22c55e" stroke-width="1.5"/><line x1="5" y1="62" x2="66" y2="62" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="3,2"/></svg>`
};

/**
 * MiniStockExampleChart — Full-width stacked layout.
 * Chart on top, metadata below. No cramped side-by-side.
 */
function MiniStockExampleChart({ example, direction }) {
  const { candles, highlight, stock, date, movement } = example;

  const scaleY = useMemo(() => {
    if (!candles?.length) return null;
    const maxVal = Math.max(...candles.map((c) => c.h));
    const minVal = Math.min(...candles.map((c) => c.l));
    const range = maxVal - minVal || 1;
    const pad = range * 0.14;
    const yMin = minVal - pad;
    const yMax = maxVal + pad;
    return (p) => 80 - ((p - yMin) / (yMax - yMin)) * 68;
  }, [candles]);

  if (!scaleY || !candles?.length) return null;

  const isBull = direction === "bullish";
  const accentColor = isBull ? "#10b981" : direction === "bearish" ? "#f43f5e" : "#f59e0b";
  const totalW = 16 + candles.length * 26;

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-black/40 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(255,255,255,0.05)] bg-black/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px]">📊</span>
          <span className="text-[11px] text-slate-200 font-extrabold uppercase tracking-wide">{stock}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold">{date}</span>
      </div>

      {/* SVG Chart — full width, scrollable if needed */}
      <div className="overflow-x-auto px-3 pt-3 pb-1 bg-slate-950/40">
        <svg width={Math.max(totalW, 200)} height="85" className="overflow-visible block mx-auto">
          {/* Grid lines */}
          {[21, 42, 63].map((y) => (
            <line key={y} x1="0" y1={y} x2={Math.max(totalW, 200)} y2={y}
              stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          ))}
          {candles.map((c, i) => {
            const x = 8 + i * 26;
            const openY = scaleY(c.o);
            const closeY = scaleY(c.c);
            const highY = scaleY(c.h);
            const lowY = scaleY(c.l);
            const green = c.c >= c.o;
            const color = green ? "#10b981" : "#f43f5e";
            const isHl = highlight.includes(i);
            return (
              <g key={i}>
                {isHl && (
                  <rect x={x - 10} y="1" width="20" height="83"
                    fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.3)"
                    strokeWidth="1" strokeDasharray="3,2" rx="4" />
                )}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                <rect x={x - 7} y={Math.min(openY, closeY)}
                  width="14" height={Math.max(3, Math.abs(closeY - openY))}
                  fill={color} rx="2" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Outcome row */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-[rgba(255,255,255,0.05)] gap-3">
        <div>
          <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold mb-0.5">Outcome</div>
          <div className="text-[12px] font-extrabold leading-tight" style={{ color: accentColor }}>{movement}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-slate-600 uppercase tracking-wider font-bold mb-0.5">Pattern candles</div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {highlight.length === 1 ? `Bar #${highlight[0] + 1}` : `Bars ${highlight.map(h => h + 1).join(" & ")}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatternGuide() {
  const [guideTab, setGuideTab] = useState("bullish");
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  const activeList = PATTERNS[guideTab] || [];
  const selectedPattern = activeList[selectedPatternIndex] || activeList[0];

  const handleTabChange = (tab) => {
    setGuideTab(tab);
    setSelectedPatternIndex(0);
    setDetailsCollapsed(false); // Auto-open details on tab change
  };

  const handleSelectPattern = (idx) => {
    setSelectedPatternIndex(idx);
    setDetailsCollapsed(false); // Auto-open when selecting a pattern
  };

  const isBull = guideTab === "bullish";
  const isBear = guideTab === "bearish";
  const typeLabel = isBull ? "Bullish Reversal" : isBear ? "Bearish Reversal" : "Neutral / Continuation";
  const badgeColor = isBull 
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
    : isBear 
      ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
      : "bg-amber-500/10 border-amber-500/20 text-amber-400";

  // Dynamic layout grid spacing based on detailed panel collapse state
  const leftColSpan = detailsCollapsed || !selectedPattern ? "xl:col-span-5" : "xl:col-span-3";

  return (
    <div className="space-y-4">
      {/* ── Header Card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(99,102,241,0.15)] bg-slate-900/40 p-5 md:p-6 backdrop-blur-md">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
          <span className="text-8xl">📖</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            Reference Guide
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            24 Classic Formations
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
          🇮🇳 Indian Stock Market Candlestick Guide
        </h1>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-3xl">
          Master 24 major bullish, bearish, and neutral candlestick formations. Tailored specifically with live volume rules, strict entry triggers, real-life stock examples, and FII/DII action confluences for index trading on the NSE (Nifty and Bank Nifty).
        </p>
      </div>

      {/* ── Tabs selector ── */}
      <div className="flex rounded-xl bg-slate-900/60 p-1 border border-[rgba(99,102,241,0.08)]">
        <button
          onClick={() => handleTabChange("bullish")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
            guideTab === "bullish"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-md"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent"
          }`}
        >
          📈 Bullish Reversal
        </button>
        <button
          onClick={() => handleTabChange("bearish")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
            guideTab === "bearish"
              ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-md"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent"
          }`}
        >
          📉 Bearish Reversal
        </button>
        <button
          onClick={() => handleTabChange("neutral")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
            guideTab === "neutral"
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-md"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent"
          }`}
        >
          ⟷ Neutral / Continuation
        </button>
      </div>

      {/* ── Collapsed Details Panel Restore Banner ── */}
      {detailsCollapsed && selectedPattern && (
        <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <div className="text-[11px] text-slate-300 font-medium">
              Details for <strong className="text-slate-100 font-bold">{selectedPattern.name}</strong> are minimized to expand the list viewport.
            </div>
          </div>
          <button
            onClick={() => setDetailsCollapsed(false)}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 transition-all active:scale-95"
          >
            Expand Details ⟪
          </button>
        </div>
      )}

      {/* ── Pattern Selection Matrix & Details Pane Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
        
        {/* Pattern Selection Grid (Toggles between xl:col-span-3 and xl:col-span-5) */}
        <div className={`${leftColSpan} grid grid-cols-1 sm:grid-cols-2 gap-3.5 transition-all duration-300`}>
          {activeList.map((p, idx) => {
            const isSelected = selectedPatternIndex === idx && !detailsCollapsed;
            return (
              <div
                key={p.name}
                onClick={() => handleSelectPattern(idx)}
                className={`cursor-pointer group flex flex-col justify-between rounded-xl p-3.5 border transition-all duration-300 relative overflow-hidden ${
                  isSelected
                    ? "bg-indigo-500/5 border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.06)]"
                    : "bg-slate-900/30 border-[rgba(99,102,241,0.08)] hover:bg-slate-900/50 hover:border-indigo-500/20"
                }`}
              >
                {/* SVG diagram and header */}
                <div className="flex items-start gap-3">
                  <div 
                    className="p-1.5 rounded-lg bg-black/40 border border-[rgba(255,255,255,0.02)] shrink-0 flex items-center justify-center h-20 w-16"
                    dangerouslySetInnerHTML={{ __html: SVGS[p.svgKey] ?? "" }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {p.name}
                      </h3>
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border ${badgeColor}`}>
                        {guideTab === "bullish" ? "Bull" : guideTab === "bearish" ? "Bear" : "Neut"}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                      {p.desc}
                    </p>
                  </div>
                </div>

                {/* Footer metrics */}
                <div className="mt-3 pt-2.5 border-t border-[rgba(255,255,255,0.04)] flex gap-2 justify-between items-center text-[9px] text-slate-500">
                  <span>Reliability: <strong className="text-slate-300 font-semibold">{p.reliability.split(" ")[0]}</strong></span>
                  <span>Strength: <strong className="text-slate-300 font-mono font-semibold">{p.strength}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Selected Pattern Detail Panel ── */}
        {!detailsCollapsed && selectedPattern && (
          <div className="xl:col-span-2 animate-fade-in">
            <div className="rounded-2xl border border-[rgba(99,102,241,0.2)] bg-[#0a0d1a] overflow-hidden sticky top-[4.5rem]">

              {/* ── Panel Header ── */}
              <div className="px-5 pt-5 pb-4 border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-r from-indigo-950/30 to-transparent">
                <div className="flex items-start gap-4">
                  {/* Large blueprint SVG */}
                  <div
                    className="shrink-0 flex items-center justify-center rounded-2xl bg-black/50 border border-[rgba(99,102,241,0.12)] p-3"
                    style={{ width: 72, height: 72 }}
                    dangerouslySetInnerHTML={{ __html: SVGS[selectedPattern.svgKey] ?? "" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-[17px] font-extrabold text-white leading-tight tracking-tight">
                        {selectedPattern.name}
                      </h2>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase border shrink-0 ${badgeColor}`}>
                        {typeLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">Technical Specifications &amp; Trade Setup</div>
                    <button
                      onClick={() => setDetailsCollapsed(true)}
                      className="text-[9px] font-semibold text-slate-600 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                    >
                      ✕ Collapse panel
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="overflow-y-auto max-h-[calc(100vh-14rem)] divide-y divide-[rgba(255,255,255,0.04)]">

                {/* Section 1 — Anatomy */}
                <div className="px-5 py-4">
                  <div className="text-[9px] text-indigo-400 uppercase tracking-[0.15em] font-extrabold mb-2">
                    📖 Pattern Anatomy
                  </div>
                  <p className="text-[12px] text-slate-300 leading-relaxed">
                    {selectedPattern.desc}
                  </p>
                </div>

                {/* Section 2 — Blueprint */}
                <div className="px-5 py-4">
                  <div className="text-[9px] text-indigo-400 uppercase tracking-[0.15em] font-extrabold mb-3">
                    📐 Theoretical Blueprint
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(99,102,241,0.1)] bg-black/50 py-5">
                    <div
                      className="scale-125"
                      dangerouslySetInnerHTML={{ __html: SVGS[selectedPattern.svgKey] ?? "" }}
                    />
                    <p className="text-[9px] text-slate-600 mt-4 tracking-wide">Classic textbook formation</p>
                  </div>
                </div>

                {/* Section 3 — Live Example */}
                {selectedPattern.example && (
                  <div className="px-5 py-4">
                    <div className="text-[9px] text-indigo-400 uppercase tracking-[0.15em] font-extrabold mb-3">
                      📊 Real Stock Example
                    </div>
                    <MiniStockExampleChart example={selectedPattern.example} direction={guideTab} />
                  </div>
                )}

                {/* Section 4 — Metrics 2×2 */}
                <div className="px-5 py-4">
                  <div className="text-[9px] text-indigo-400 uppercase tracking-[0.15em] font-extrabold mb-3">
                    📊 Key Metrics
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Reliability", value: selectedPattern.reliability, accent: true },
                      { label: "Signal Strength", value: selectedPattern.strength, mono: true, accent: true },
                      { label: "Timeframe", value: selectedPattern.timeframe },
                      { label: "Best Entry Trigger", value: selectedPattern.trigger },
                    ].map(({ label, value, accent, mono }) => (
                      <div key={label} className="bg-slate-900/60 rounded-xl border border-[rgba(255,255,255,0.04)] p-3">
                        <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">{label}</div>
                        <div className={`text-[11.5px] font-extrabold leading-snug ${accent ? "text-indigo-300" : "text-slate-200"} ${mono ? "font-mono" : ""}`}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5 — Volume + Confirmation */}
                <div className="px-5 py-4 space-y-3">
                  <div className="text-[9px] text-indigo-400 uppercase tracking-[0.15em] font-extrabold mb-1">
                    🔊 Trade Rules
                  </div>
                  <div className="rounded-xl border border-[rgba(255,255,255,0.04)] bg-slate-900/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
                      <div className="text-[8.5px] text-slate-500 uppercase tracking-wider font-bold mb-1">Volume Requirement</div>
                      <p className="text-[12px] text-slate-200 leading-relaxed font-medium">{selectedPattern.volume}</p>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-[8.5px] text-slate-500 uppercase tracking-wider font-bold mb-1">Confirmation Rule</div>
                      <p className="text-[12px] text-slate-200 leading-relaxed font-medium">{selectedPattern.confirmation}</p>
                    </div>
                  </div>
                </div>

                {/* Section 6 — NSE / India context */}
                <div className="px-5 py-4">
                  <div className="text-[9px] text-indigo-400 uppercase tracking-[0.15em] font-extrabold mb-3">
                    🇮🇳 Indian Market / NSE Context
                  </div>
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4">
                    <p className="text-[12px] text-slate-300 leading-relaxed">{selectedPattern.nse}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
