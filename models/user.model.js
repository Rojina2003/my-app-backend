const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
    },
    lname: {
      type: String,
      required: false,
      unique: false
    },
    number: {
      type: Number,
      require: true,
      unique: true,
      
    },
    gname:{
      type:String,
      
    },
    password: {
      type: String,
      require: true,
      unique: true,
      
    },
    
    image: {
        type: String,
        require: false,
    },
    
  }, {
    timestamps: true,
  });



const User = mongoose.model('User', userSchema);

module.exports = User;
