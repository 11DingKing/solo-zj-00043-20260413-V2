FROM python:3.12-slim

COPY . /back_app

WORKDIR /back_app

RUN pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple --trusted-host mirrors.aliyun.com

RUN mkdir -p /back_app/data

EXPOSE 8000

CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" ]