from fastapi import APIRouter, HTTPException, status, Depends
from supabase import Client
from typing import Optional
import uuid

from app.database import get_current_supabase
from app.models.response import SuccessResponse
from app.auth import get_current_user

router = APIRouter()

@router.post("/create-intent", response_model=SuccessResponse)
async def create_payment_intent(
    payment_data: dict,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Create payment intent for order"""
    try:
        amount = payment_data.get("amount")
        currency = payment_data.get("currency", "INR")
        payment_method = payment_data.get("payment_method", "card")
        order_id = payment_data.get("order_id")
        
        if not amount or amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid amount is required"
            )
        
        # For demo purposes, we'll simulate payment intent creation
        # In production, you would integrate with actual payment gateways like Stripe, Razorpay, etc.
        
        payment_intent = {
            "id": f"pi_{uuid.uuid4().hex[:24]}",
            "amount": amount,
            "currency": currency,
            "status": "requires_payment_method",
            "client_secret": f"pi_{uuid.uuid4().hex[:24]}_secret_{uuid.uuid4().hex[:10]}",
            "payment_method": payment_method,
            "order_id": order_id,
            "created_at": "now()"
        }
        
        # Store payment intent in database
        response = supabase.table("payment_intents").insert(payment_intent).execute()
        
        return SuccessResponse(
            message="Payment intent created successfully",
            data={
                "client_secret": payment_intent["client_secret"],
                "payment_intent_id": payment_intent["id"],
                "amount": amount,
                "currency": currency
            }
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment intent: {str(e)}"
        )

@router.post("/confirm", response_model=SuccessResponse)
async def confirm_payment(
    payment_data: dict,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_current_supabase)
):
    """Confirm payment and update order status"""
    try:
        payment_intent_id = payment_data.get("payment_intent_id")
        payment_method_id = payment_data.get("payment_method_id")
        order_id = payment_data.get("order_id")
        
        if not payment_intent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment intent ID is required"
            )
        
        # Get payment intent
        intent_response = supabase.table("payment_intents").select("*").eq("id", payment_intent_id).execute()
        
        if not intent_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment intent not found"
            )
        
        # For demo purposes, simulate successful payment
        # In production, you would verify the payment with the payment gateway
        
        payment_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "order_id": order_id,
            "payment_intent_id": payment_intent_id,
            "payment_method_id": payment_method_id,
            "amount": intent_response.data[0]["amount"],
            "currency": intent_response.data[0]["currency"],
            "status": "succeeded",
            "created_at": "now()"
        }
        
        # Store payment record
        payment_response = supabase.table("payments").insert(payment_record).execute()
        
        if not payment_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to record payment"
            )
        
        # Update order status to confirmed
        if order_id:
            supabase.table("orders").update({
                "status": "confirmed",
                "payment_status": "paid",
                "updated_at": "now()"
            }).eq("id", order_id).execute()
        
        # Update payment intent status
        supabase.table("payment_intents").update({
            "status": "succeeded"
        }).eq("id", payment_intent_id).execute()
        
        return SuccessResponse(
            message="Payment confirmed successfully",
            data={
                "payment_id": payment_record["id"],
                "status": "succeeded",
                "order_id": order_id
            }
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm payment: {str(e)}"
        )

@router.get("/methods", response_model=dict)
async def get_payment_methods():
    """Get available payment methods"""
    try:
        payment_methods = [
            {
                "id": "card",
                "name": "Credit/Debit Card",
                "icon": "credit-card",
                "description": "Pay with your credit or debit card"
            },
            {
                "id": "upi",
                "name": "UPI",
                "icon": "smartphone",
                "description": "Pay with UPI apps like GPay, PhonePe, Paytm"
            },
            {
                "id": "netbanking",
                "name": "Net Banking",
                "icon": "building-bank",
                "description": "Pay directly from your bank account"
            },
            {
                "id": "wallet",
                "name": "Digital Wallet",
                "icon": "wallet",
                "description": "Pay with digital wallets"
            },
            {
                "id": "cod",
                "name": "Cash on Delivery",
                "icon": "banknotes",
                "description": "Pay when your order is delivered"
            }
        ]
        
        return {
            "payment_methods": payment_methods
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get payment methods: {str(e)}"
        )