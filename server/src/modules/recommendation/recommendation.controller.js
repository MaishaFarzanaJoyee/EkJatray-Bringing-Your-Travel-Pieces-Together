import Destination from './destination.model.js';

export const getRecommendations = async (req, res) => {
    try {
        const userBudget = parseInt(req.query.budget) || 999999; 
        const userTags = req.query.tags ? req.query.tags.split(',') : [];

        const affordableDestinations = await Destination.find({
            cost: { $lte: userBudget } 
        });

        const scoredDestinations = affordableDestinations.map(dest => {
            let score = 0;
            dest.tags.forEach(tag => {
                if (userTags.includes(tag)) score++;
            });
            return { ...dest.toObject(), matchScore: score };
        });

        scoredDestinations.sort((a, b) => b.matchScore - a.matchScore);
        res.status(200).json(scoredDestinations);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching recommendations" });
    }
};