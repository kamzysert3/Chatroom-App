const axios = require('axios')

exports.answer = async (q) => {
    try {
        const response = await axios.post('https://8819-34-124-138-80.ngrok-free.app/predict', {
            input_text: q
        });

        return response.data
    } catch (error) {
        console.error("Error getting Answer: \n", error.message);
        return {
            error: `An error occurred\n${error.message}`
        }
    }
}