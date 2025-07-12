import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { ParticleBackground } from '../components/ParticleBackground';

export function Pricing() {
  const plans = [
    {
      name: 'Hobby',
      icon: Star,
      price: 3,
      description: 'Perfect for home cooks',
      features: [
        'Ad-Free Forever',
        'Save & Remix Recipes',
        'Clean Recipe View',
        'Comment & Like',
        'Mobile App Access',
        'Basic Search & Filters'
      ],
      active: true,
      highlight: false,
    },
    {
      name: 'Sous',
      icon: Crown,
      price: 7,
      description: 'For serious cooking enthusiasts',
      features: [
        'Everything in Hobby',
        'AI Ingredient Substitution',
        'Smart Pantry Management',
        'Weekly Meal Planner',
        'Recipe Collections',
        'Advanced Search & Analytics'
      ],
      active: false,
      highlight: true,
    },
    {
      name: 'Chef',
      icon: Zap,
      price: 12,
      description: 'For culinary professionals',
      features: [
        'Everything in Sous',
        'Live Cooking Events',
        'Private Cooking Clubs',
        'Recipe Challenges',
        'Priority Support',
        'Beta Feature Access'
      ],
      active: false,
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 relative py-20">
      <ParticleBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Choose Your
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent block">
              Cooking Journey
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Join thousands of food lovers in our ad-free community. Start with our Hobby plan 
            and upgrade as your culinary skills grow.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 ${
                  plan.highlight
                    ? 'border-orange-500 scale-105'
                    : 'border-gray-100 hover:border-orange-200'
                } ${!plan.active ? 'opacity-75' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {!plan.active && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Coming Soon
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    plan.highlight 
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600 ml-1">/month</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className={`w-5 h-5 mr-3 ${
                        plan.active ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <span className={plan.active ? 'text-gray-700' : 'text-gray-500'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={plan.active ? { scale: 1.05 } : {}}
                  whileTap={plan.active ? { scale: 0.95 } : {}}
                  disabled={!plan.active}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.active
                      ? plan.highlight
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {plan.active ? 'Get Started' : 'Coming Soon'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-2">Why is OmNom ad-free?</h3>
              <p className="text-gray-600">
                We believe cooking should be enjoyable and distraction-free. That's why we use a subscription 
                model instead of ads to keep our platform clean and focused on what matters most - great recipes.
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">
                Absolutely! You can change your plan at any time. Upgrades take effect immediately, 
                and downgrades will take effect at the end of your current billing cycle.
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-2">What happens to my recipes if I cancel?</h3>
              <p className="text-gray-600">
                Your recipes will remain public on the platform, but you'll lose access to premium features. 
                You can always resubscribe to regain full access to your account.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}