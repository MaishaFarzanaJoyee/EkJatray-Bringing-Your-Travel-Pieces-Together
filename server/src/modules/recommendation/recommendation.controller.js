const Destination = require('./destination.model');

const getRecommendations = async (req, res) => {
    try {
        // 1. Get user preferences from the URL query (e.g., /api/recommendations?budget=5000&tags=beach,relax)
        const userBudget = parseInt(req.query.budget) || 999999; // Default to high budget if none provided
        const userTags = req.query.tags ? req.query.tags.split(',') : [];

        // 2. The Hard Rule: Ask MongoDB only for destinations that fit the budget
        // $lte means "Less Than or Equal to"
        const affordableDestinations = await Destination.find({
            cost: { $lte: userBudget } 
        });

        // 3. The Soft Rule (Scoring): Give points for matching tags
        const scoredDestinations = affordableDestinations.map(dest => {
            let score = 0;
            
            // For every tag the destination has, check if the user asked for it. If yes, +1 point.
            dest.tags.forEach(tag => {
                if (userTags.includes(tag)) {
                    score++;
                }
            });

            // Return the destination data along with its new match score
            return { ...dest.toObject(), matchScore: score };
        });

        // 4. Sort the list so the highest score is at the top
        scoredDestinations.sort((a, b) => b.matchScore - a.matchScore);

        // 5. Send the sorted JSON back to the React/HTML Frontend
        res.status(200).json(scoredDestinations);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching recommendations" });
    }
};

module.exports = { getRecommendations };