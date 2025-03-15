const express = require('express');
const router = express.Router();
const UserData = require('../models/UserData');

router.post('/', async (req, res, next) => {
  try {
    const { formData, handData } = req.body;
    
    const userData = new UserData({
      name: formData.name,
      handDominance: formData.handDominance,
      treatment: formData.treatment,
      symptomsDate: formData.symptomsDate,
      handTrackingData: handData ? [{ 
        timestamp: new Date(),
        ...handData 
      }] : []
    });

    await userData.save();
    res.status(201).json(userData);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 