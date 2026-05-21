FROM python:3.11-slim

WORKDIR /workspace
ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PIP_NO_CACHE_DIR=1

# Copy requirements and install
COPY requirments.txt /workspace/app/requirments.txt
RUN pip install --no-cache-dir --no-compile -r /workspace/app/requirments.txt

# Copy project into /workspace/app so package name `app` is available
COPY . /workspace/app

# Ensure Python can import the top-level `app` package
ENV PYTHONPATH=/workspace

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]