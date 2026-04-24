"""
eSewa ePay V2 Integration
Docs: https://developer.esewa.com.np/pages/Epay-V2

Flow:
  1. Frontend submits a form POST to eSewa with signed payload
  2. eSewa processes → redirects to success_url or failure_url
  3. success_url receives base64-encoded response
  4. Backend decodes & verifies HMAC signature to confirm payment

Note: eSewa V2 uses a FORM POST from the frontend (not a server-side redirect).
      The backend's job is to:
        a) Generate the HMAC signature for the form fields
        b) Verify the callback response signature
"""
import base64
import hashlib
import hmac
import json
import requests
from django.conf import settings


ESEWA_PAYMENT_URL_SANDBOX = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
ESEWA_PAYMENT_URL_LIVE    = "https://epay.esewa.com.np/api/epay/main/v2/form"
ESEWA_STATUS_URL_SANDBOX  = "https://uat.esewa.com.np/api/epay/transaction/status/"
ESEWA_STATUS_URL_LIVE     = "https://epay.esewa.com.np/api/epay/transaction/status/"


def _is_live():
    return getattr(settings, 'ESEWA_IS_LIVE', False)


def _secret_key():
    return settings.ESEWA_SECRET_KEY


def _product_code():
    return settings.ESEWA_PRODUCT_CODE  # e.g. "EPAYTEST" for sandbox


def generate_signature(total_amount: str, transaction_uuid: str) -> str:
    """
    Generate HMAC-SHA256 base64 signature.
    Signed fields (in order): total_amount, transaction_uuid, product_code
    """
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={_product_code()}"
    secret = _secret_key().encode('utf-8')
    signature = hmac.new(secret, message.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(signature).decode('utf-8')


def get_payment_form_data(amount_npr: float, transaction_uuid: str,
                          success_url: str, failure_url: str) -> dict:
    """
    Returns the form fields to POST to eSewa from the frontend.
    The frontend should submit these as a form to the eSewa payment URL.
    """
    total_amount = str(int(amount_npr))  # eSewa uses whole NPR (no paisa)
    signature = generate_signature(total_amount, str(transaction_uuid))

    return {
        "payment_url": ESEWA_PAYMENT_URL_LIVE if _is_live() else ESEWA_PAYMENT_URL_SANDBOX,
        "form_fields": {
            "amount": total_amount,
            "tax_amount": "0",
            "total_amount": total_amount,
            "transaction_uuid": str(transaction_uuid),
            "product_code": _product_code(),
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": success_url,
            "failure_url": failure_url,
            "signed_field_names": "total_amount,transaction_uuid,product_code",
            "signature": signature,
        },
    }


def decode_callback_response(encoded_response: str) -> dict:
    """
    Decode the base64 response eSewa sends to success_url as ?data=<base64>
    """
    try:
        decoded = base64.b64decode(encoded_response).decode('utf-8')
        return json.loads(decoded)
    except Exception as e:
        raise Exception(f"Failed to decode eSewa response: {e}")


def verify_callback_signature(response_data: dict) -> bool:
    """
    Verify the HMAC signature in the eSewa callback response.
    """
    received_signature = response_data.get('signature', '')
    signed_fields = response_data.get('signed_field_names', '').split(',')
    message = ','.join(f"{field}={response_data.get(field, '')}" for field in signed_fields)
    secret = _secret_key().encode('utf-8')
    expected = base64.b64encode(
        hmac.new(secret, message.encode('utf-8'), hashlib.sha256).digest()
    ).decode('utf-8')
    return hmac.compare_digest(received_signature, expected)


def check_transaction_status(transaction_uuid: str, total_amount: float) -> dict:
    """
    Server-side status check for a transaction.
    Returns: {'status': 'COMPLETE'|'PENDING'|'FULL_REFUND'|..., ...}
    """
    url = ESEWA_STATUS_URL_LIVE if _is_live() else ESEWA_STATUS_URL_SANDBOX
    params = {
        "product_code": _product_code(),
        "total_amount": int(total_amount),
        "transaction_uuid": str(transaction_uuid),
    }
    response = requests.get(url, params=params, timeout=15)
    if response.status_code != 200:
        raise Exception(f"eSewa status check failed: {response.text}")
    return response.json()
