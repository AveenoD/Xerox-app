import axios from 'axios'
import {ApiError} from './ApiError.js'
export const sendOtpSms = async (phone, otp) => {
  console.log(`📱 Phone OTP for ${phone}: ${otp}`)
    return true

        // const smsApiUrl = 'https://www.fast2sms.com/dev/bulkV2'
        // const apiKey = process.env.SMS_API_KEY
        // const response = await axios.post(smsApiUrl, {
        //     apiKey,
        //     to: phone,
        //     message: `Your OTP code is ${otp}. It will expire in 10 minutes.`
        // })
        // if (response.data.success) {
        //     console.log(`OTP sent successfully to ${phone}`)
        // }
        // else {  
        //     console.error(`Failed to send OTP to ${phone}: ${response.data.error}`)
        //     throw new ApiError(500, "Failed to send OTP. Please try again later.")
        // }   

   
}

