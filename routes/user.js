const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const User = require('../models/User');
const Tattoo = require('../models/Tattoo');
const Folder = require('../models/Folder');
const uploader = require('../configs/cloudinary-setup');


// Find logged user
router.get('/user', (req, res) => {
  User.findById(req.user.id)
    .populate('favoriteArtist artistTattoo flash')
    .populate({ path: 'chatHistoric', populate: { path: 'user' } })
    .populate({ path: 'folder', populate: { path: 'image' } })
    .then(user => res.json(user))
    .catch(err => res.json(err));
});

// Edit profile picture
router.put('/profile-pic', (req, res, next) => {
  const { image } = req.body;
  console.log('imageeeee', image);
  User.findByIdAndUpdate(req.user.id, { $set: { profileImg: image } })
    .then(() => {
      res.json({ message: `User with ${req.user.id} is updated successfully.` });
    })
    .catch((err) => {
      res.json(err);
    });
})

// Create empty folder
router.post('/create-folder', (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Folder name required' });
    return;
  }

  const newFolder = new Folder({
    name,
  });

  newFolder.save()
    .then(() => {
      User.findByIdAndUpdate(req.user.id, { $push: { folder: newFolder } })
        .then(response => res.status(200).json(response))
        .catch(err => res.status(400).json(err));
    })
    .catch(err => res.status(400).json(err));
});

// Delete folder
router.delete('/delete-folder/:folderId', (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.folderId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  User.findByIdAndUpdate(req.user.id, { $pull: { folder: req.params.folderId } })
    .then(() => {
      Folder.findByIdAndRemove(req.params.folderId)
        .then(() => {
          res.json({ message: `Folder with ${req.params.folderId} is removed successfully.` });
        })
        .catch(err => res.json(err));
    })
    .catch((err) => {
      res.json(err);
    });
});

// Add tattoo to designated folder
router.post('/add-tattoo-folder', (req, res) => {
  const { tattooId, folderId } = req.body;
  Tattoo.findById(tattooId)
    .then((tattoo) => {
      Folder.findOneAndUpdate({ _id: folderId }, { $push: { image: tattoo } })
        .then(response => res.status(200).json(response))
        .catch(err => res.status(400).json(err));
    })
    .catch(err => res.status(400).json(err));
});

// Remove tattoo inside designated folder
router.put('/folder/:folderId/remove/:tattooId', (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.folderId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  Folder.findByIdAndUpdate(req.params.folderId, { $pull: { image: req.params.tattooId } })
    .then(() => {
      res.json({ message: `Folder with ${req.params.folderId} is updated successfully.` });
    })
    .catch((err) => {
      res.json(err);
    });
});

// Add favorite Artist
router.put('/favorite-artist/:artistId', (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.artistId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  User.findByIdAndUpdate(req.user.id, { $push: { favoriteArtist: req.params.artistId } })
    .then(() => res.json({ message: `User with ${req.params.artistId} is updated successfully.` }))
    .catch(err => res.json(err));
});

// Remove favorite Artist
router.put('/favorite-artist-remove/:artistId', (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.artistId)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  User.findByIdAndUpdate(req.user.id, { $pull: { favoriteArtist: req.params.artistId } })
    .then(() => res.json({ message: `User with ${req.params.artistId} is updated successfully.` }))
    .catch(err => res.json(err));
});

module.exports = router;
