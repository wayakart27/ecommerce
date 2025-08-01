

import dbConnect from "@/lib/mongodb";
import TwoFactorConfirmation from "@/model/two-factor-confirmation";

export async function deleteTwoFactorConfirmationById(id) {
  await dbConnect();
  return await TwoFactorConfirmation.findByIdAndDelete(id);
}
