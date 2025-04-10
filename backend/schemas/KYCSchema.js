import mongoose from "mongoose";

const basicKYCSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  mobile: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) { return /^[0-9]{10,15}$/.test(v); },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  nationality: { type: String, required: true },
  documentType: { 
    type: String, 
    required: true,
    enum: ['passport', 'adharcard' , 'pan_card']
  },
  documentNumber: { 
    type: String, 
    required: true, 
    unique: true  
  },
  documentImage: { 
    front: { type: String, required: true },
    back: { type: String, required: function() { return this.documentType === 'adharcard'; } } 
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, { 
  timestamps: true,
  autoIndex: true
});

basicKYCSchema.index({ mobile: 1 });
basicKYCSchema.index({ status: 1 });

const BasicKYC = mongoose.model('BasicKYC', basicKYCSchema);

export default BasicKYC;

















































// const mongoose = require('mongoose');
// const validator = require('validator');

// const kycSchema = new mongoose.Schema({
//   // Basic user information
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     unique: true
//   },
//   registrationDate: {
//     type: Date,
//     default: Date.now
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'under_review', 'approved', 'rejected', 'needs_more_info'],
//     default: 'pending'
//   },
//   rejectionReason: {
//     type: String,
//     default: null
//   },
//   lastUpdated: {
//     type: Date,
//     default: Date.now
//   },

//   // Personal Information
//   personalInfo: {
//     firstName: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     middleName: {
//       type: String,
//       trim: true
//     },
//     lastName: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     dateOfBirth: {
//       type: Date,
//       required: true
//     },
//     gender: {
//       type: String,
//       enum: ['male', 'female', 'other', 'prefer_not_to_say'],
//       required: true
//     },
//     nationality: {
//       type: String,
//       required: true
//     },
//     maritalStatus: {
//       type: String,
//       enum: ['single', 'married', 'divorced', 'widowed', 'separated']
//     }
//   },

//   // Contact Information
//   contactInfo: {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       validate: [validator.isEmail, 'Please provide a valid email']
//     },
//     phone: {
//       type: String,
//       required: true,
//       validate: {
//         validator: function(v) {
//           return /\d{10,15}/.test(v);
//         },
//         message: props => `${props.value} is not a valid phone number!`
//       }
//     },
//     alternatePhone: {
//       type: String,
//       validate: {
//         validator: function(v) {
//           return /\d{10,15}/.test(v);
//         },
//         message: props => `${props.value} is not a valid phone number!`
//       }
//     },
//     address: {
//       street: { type: String, required: true },
//       city: { type: String, required: true },
//       state: { type: String, required: true },
//       postalCode: { type: String, required: true },
//       country: { type: String, required: true }
//     }
//   },

//   // Identity Documents
//   identityDocuments: {
//     documentType: {
//       type: String,
//       enum: ['passport', 'national_id', 'driver_license', 'voter_id', 'other'],
//       required: true
//     },
//     documentNumber: {
//       type: String,
//       required: true,
//       unique: true
//     },
//     documentIssuingCountry: {
//       type: String,
//       required: true
//     },
//     documentIssueDate: {
//       type: Date
//     },
//     documentExpiryDate: {
//       type: Date,
//       required: true
//     },
//     documentFrontImage: {
//       type: String, // URL or path to stored image
//       required: true
//     },
//     documentBackImage: {
//       type: String // URL or path to stored image
//     },
//     selfieWithDocument: {
//       type: String // URL or path to stored image
//     }
//   },

//   // Additional Verification Data
//   biometricData: {
//     fingerprintHash: {
//       type: String
//     },
//     facialRecognitionData: {
//       type: String
//     }
//   },

//   // Financial Information (for certain KYC requirements)
//   financialInfo: {
//     occupation: {
//       type: String,
//       enum: ['employed', 'self_employed', 'unemployed', 'student', 'retired']
//     },
//     sourceOfFunds: {
//       type: String,
//       enum: ['salary', 'business', 'investments', 'inheritance', 'other']
//     },
//     estimatedAnnualIncome: {
//       type: Number
//     },
//     taxIdentificationNumber: {
//       type: String
//     }
//   },

//   // Metadata
//   metadata: {
//     ipAddress: {
//       type: String
//     },
//     deviceInfo: {
//       type: String
//     },
//     geolocation: {
//       type: {
//         type: String,
//         default: 'Point'
//       },
//       coordinates: {
//         type: [Number]
//       }
//     }
//   },

//   // Verification flags
//   isEmailVerified: {
//     type: Boolean,
//     default: false
//   },
//   isPhoneVerified: {
//     type: Boolean,
//     default: false
//   },
//   isDocumentVerified: {
//     type: Boolean,
//     default: false
//   },
//   isBiometricVerified: {
//     type: Boolean,
//     default: false
//   },

//   // Audit trail
//   verificationHistory: [{
//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     verificationType: String,
//     status: String,
//     timestamp: {
//       type: Date,
//       default: Date.now
//     },
//     notes: String
//   }]
// }, {
//   timestamps: true
// });

// // Index for faster queries
// kycSchema.index({ userId: 1 });
// kycSchema.index({ status: 1 });
// kycSchema.index({ 'identityDocuments.documentNumber': 1 });
// kycSchema.index({ 'personalInfo.dateOfBirth': 1 });
// kycSchema.index({ 'contactInfo.email': 1 });
// kycSchema.index({ 'contactInfo.phone': 1 });

// const KYC = mongoose.model('KYC', kycSchema);

// module.exports = KYC;