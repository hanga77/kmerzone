import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
    isDefault: { type: Boolean, default: false },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    latitude: Number,
    longitude: Number,
});

const warningSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    reason: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    password: { type: String, select: false },
    role: {
        type: String,
        enum: ['customer', 'seller', 'superadmin', 'delivery_agent', 'depot_agent'],
        required: true,
    },
    shopName: { type: String },
    location: { type: String },
    loyalty: {
        status: { type: String, enum: ['standard', 'premium', 'premium_plus'], default: 'standard' },
        orderCount: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        premiumStatusMethod: { type: String, enum: ['loyalty', 'deposit', 'subscription', null], default: null },
    },
    availabilityStatus: {
        type: String,
        enum: ['available', 'unavailable'],
    },
    warnings: [warningSchema],
    depotId: { type: String },
    addresses: [addressSchema],
    followedStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
