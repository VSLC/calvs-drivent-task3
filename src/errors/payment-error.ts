import { ApplicationError } from "@/protocols";

export function paymentError(): ApplicationError {
  return {
    name: "PaymentError",
    message: "You need to pay the ticket to acess hotels",
  };
}
