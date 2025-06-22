/**
 * Plan configurations for Claude usage limits
 */

const PLANS = {
    pro: {
        name: 'Claude Pro',
        limit_per_5h: 1000,
        daily_limit: 5000,
        description: 'Claude Pro plan - High message limits'
    },
    max5: {
        name: 'Claude Max5',
        limit_per_5h: 40,
        daily_limit: 200,
        description: 'Claude Max plan - 5 conversations per day'
    },
    max20: {
        name: 'Claude Max20',
        limit_per_5h: 160,
        daily_limit: 800,
        description: 'Claude Max plan - 20 conversations per day'
    },
    custom: {
        name: 'Custom Plan',
        limit_per_5h: 100,
        daily_limit: 500,
        description: 'Custom plan - Configurable limits'
    }
};

class PlanConfig {
    static getPlan(planName) {
        return PLANS[planName.toLowerCase()] || PLANS.pro;
    }
    
    static listPlans() {
        return Object.keys(PLANS);
    }
    
    static getAllPlans() {
        return PLANS;
    }
}

module.exports = {
    PlanConfig,
    PLANS
};