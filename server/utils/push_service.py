import os
import requests


class PushService:
    def __init__(self):
        self.expo_endpoint = 'https://exp.host/--/api/v2/push/send'
        self.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        access_token = os.getenv('EXPO_PUSH_ACCESS_TOKEN')
        if access_token:
            self.headers['Authorization'] = f'Bearer {access_token}'

    def send_messages(self, messages):
        response = requests.post(self.expo_endpoint, json=messages, headers=self.headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def build_message(self, to_token: str, title: str, body: str, data: dict | None = None):
        return {
            'to': to_token,
            'sound': 'default',
            'title': title,
            'body': body,
            'data': data or {},
        }


push_service = PushService()


