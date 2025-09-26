'use client';

import React, { useState } from 'react';
import { useOnboarding } from '@/context/onboardingContext';
import { useRouter } from 'next/navigation';

const OnboardingPage = () => {
    const { onboardingData, updateOnboardingData, isOnboardingComplete } = useOnboarding();
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    const questions = [
        {
            id: 'morningPreference',
            question: "Do you prefer starting your day with tea, coffee, or just good vibes?",
            type: 'select',
            options: [
                { value: 'tea', label: '☕ Tea', emoji: '🍵' },
                { value: 'coffee', label: '☕ Coffee', emoji: '☕' },
                { value: 'good_vibes', label: '✨ Good Vibes', emoji: '✨' }
            ]
        },
        {
            id: 'dayColor',
            question: "If today were a color, which one would it be for you?",
            type: 'color',
            options: [
                { value: 'red', label: 'Red', color: '#ef4444' },
                { value: 'orange', label: 'Orange', color: '#f97316' },
                { value: 'yellow', label: 'Yellow', color: '#eab308' },
                { value: 'green', label: 'Green', color: '#22c55e' },
                { value: 'blue', label: 'Blue', color: '#3b82f6' },
                { value: 'purple', label: 'Purple', color: '#a855f7' },
                { value: 'pink', label: 'Pink', color: '#ec4899' },
                { value: 'black', label: 'Black', color: '#1f2937' }
            ]
        },
        {
            id: 'moodEmoji',
            question: "What emoji best describes your mood right now?",
            type: 'emoji',
            options: [
                { value: '😊', label: 'Happy' },
                { value: '😎', label: 'Cool' },
                { value: '🤔', label: 'Thoughtful' },
                { value: '😴', label: 'Sleepy' },
                { value: '🚀', label: 'Energetic' },
                { value: '😌', label: 'Peaceful' },
                { value: '🤩', label: 'Excited' },
                { value: '😤', label: 'Determined' }
            ]
        },
        {
            id: 'lifeGenre',
            question: "If your life were a movie today, what genre would it be—comedy, drama, or adventure?",
            type: 'select',
            options: [
                { value: 'comedy', label: '🎭 Comedy', emoji: '😂' },
                { value: 'drama', label: '🎬 Drama', emoji: '😢' },
                { value: 'adventure', label: '🗺️ Adventure', emoji: '🏔️' }
            ]
        },
        {
            id: 'weeklyGoal',
            question: "What's a little goal you're proud of achieving this week?",
            type: 'text'
        },
        {
            id: 'favoriteApp',
            question: "If you could only keep one app on your phone, which one would survive?",
            type: 'text'
        }
    ];

    const handleAnswer = (value: string) => {
        const question = questions[currentStep];
        updateOnboardingData({ [question.id]: value });
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Onboarding complete, redirect to register
            router.push('/register');
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentQuestion = questions[currentStep];
    const currentAnswer = onboardingData[currentQuestion.id as keyof typeof onboardingData];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Step {currentStep + 1} of {questions.length}</span>
                        <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center leading-relaxed">
                        {currentQuestion.question}
                    </h2>

                    {/* Answer Options */}
                    <div className="space-y-4">
                        {currentQuestion.type === 'select' && (
                            <div className="grid gap-3">
                                {currentQuestion.options?.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(option.value)}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${currentAnswer === option.value
                                            ? 'border-blue-500 bg-blue-500/20 text-white'
                                            : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.emoji}</span>
                                            <span className="font-medium">{option.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentQuestion.type === 'color' && (
                            <div className="grid grid-cols-4 gap-3">
                                {currentQuestion.options?.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(option.value)}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${currentAnswer === option.value
                                            ? 'border-white scale-110'
                                            : 'border-gray-600 hover:border-gray-400'
                                            }`}
                                        style={{ backgroundColor: option.color }}
                                    >
                                        <div className="text-center">
                                            <div className="text-white font-medium text-sm">{option.label}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentQuestion.type === 'emoji' && (
                            <div className="grid grid-cols-4 gap-3">
                                {currentQuestion.options?.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(option.value)}
                                        className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${currentAnswer === option.value
                                            ? 'border-blue-500 bg-blue-500/20 scale-110'
                                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700'
                                            }`}
                                    >
                                        <div className="text-4xl mb-2">{option.value}</div>
                                        <div className="text-gray-300 text-sm">{option.label}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentQuestion.type === 'text' && (
                            <div className="space-y-4">
                                <textarea
                                    value={currentAnswer as string || ''}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                    rows={4}
                                />
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!currentAnswer}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        >
                            {currentStep === questions.length - 1 ? '🎉 Complete & Register' : 'Next'}
                        </button>
                    </div>
                </div>

                {/* Skip Option */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/register')}
                        className="text-gray-400 hover:text-gray-300 text-sm underline"
                    >
                        Skip onboarding
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
