"""
Khalti Payment Gateway Integration
Docs: https://docs.khalti.com/khalti-epayment/

Flow:
  1. POST /epayment/initiate/  → get pidx + payment_url
  2. Redirect user to payment_url
  3. User pays → Khalti redirects to return_url with pidx & status
  4. POST /epayment/lookup/    → verify payment server-side
"""
import requests
from django.conf import settings


KHALTI_INITIATE_URL_SANDBOX = "https://dev.khalti.com/api/v2/epayment/initiate/"
KHALTI_LOOKUP_URL_SANDBOX    = "https://dev.khalti.com/api/v2/epayment/lookup/"
KHALTI_INITIATE_URL_LIVE     = "https://khalti.com/api/v2/epayment/initiate/"
KHALTI_LOOKUP_URL_LIVE       = "https://khalti.com/api/v2/epayment/lookup/"


def _get_urls():
    if getattr(settings, 'KHALTI_IS_LIVE', False):
        return KHALTI_INITIATE_URL_LIVE, KHALTI_LOOKUP_URL_LIVE
    return KHALTI_INITIATE_URL_SANDBOX, KHALTI_LOOKUP_URL_SANDBOX


def _headers():
    key = getattr(settings, 'KHALTI_SECRET_KEY', '')
    if not key or key.startswith('your-'):
        raise Exception(
            'Khalti is not configured. Please add your KHALTI_SECRET_KEY to .env. '
            'Get your sandbox key from https://test-admin.khalti.com'
        )
    return {
        "Authorization": f"Key {key}",
        "Content-Type": "application/json",
    }


def initiate_payment(amount_npr: float, transaction_uuid: str,
                     order_name: str, return_url: str,
                     customer_name: str = "", customer_email: str = "",
                     customer_phone: str = "") -> dict:
    """
    Initiate a Khalti payment.
    amount_npr: amount in NPR (will be converted to paisa internally)
    Returns: {'pidx': ..., 'payment_url': ..., 'expires_at': ...}
    Raises: Exception on failure
    """
    initiate_url, _ = _get_urls()
    amount_paisa = int(amount_npr * 100)

    payload = {
        "return_url": return_url,
        "website_url": getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
        "amount": amount_paisa,
        "purchase_order_id": str(transaction_uuid),
        "purchase_order_name": order_name,
        "customer_info": {
            "name": customer_name,
            "email": customer_email,
            "phone": customer_phone or "9800000000",
        },
    }

    response = requests.post(initiate_url, json=payload, headers=_headers(), timeout=15)
    data = response.json()

    if response.status_code != 200:
        raise Exception(data.get('detail') or data.get('error_key') or str(data))

    return {
        "pidx": data["pidx"],
        "payment_url": data["payment_url"],
        "expires_at": data.get("expires_at"),
        "raw": data,
    }


def verify_payment(pidx: str) -> dict:
    """
    Verify a Khalti payment after callback.
    Returns: {'status': 'Completed'|'Pending'|..., 'transaction_id': ..., 'amount': ...}
    Raises: Exception on failure
    """
    _, lookup_url = _get_urls()

    response = requests.post(lookup_url, json={"pidx": pidx},
                             headers=_headers(), timeout=15)
    data = response.json()

    if response.status_code != 200:
        raise Exception(data.get('detail') or str(data))

    return {
        "status": data.get("status"),                    # "Completed", "Pending", "Expired"
        "transaction_id": data.get("transaction_id"),
        "amount_paisa": data.get("total_amount"),
        "amount_npr": data.get("total_amount", 0) / 100,
        "pidx": data.get("pidx"),
        "raw": data,
    }
