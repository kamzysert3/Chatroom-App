const axios = require('axios')

exports.answer = async (q) => {
    try {
        const response = await axios.post('https://f227-34-19-49-144.ngrok-free.app/predict', {
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