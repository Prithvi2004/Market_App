FROM python:3.11-slim
WORKDIR /app
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.3/en_core_web_sm-3.7.3.tar.gz
COPY . .
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
