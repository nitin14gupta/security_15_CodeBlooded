'use client'

import React, { useState } from 'react'

export default function DittoPage() {
    const [inputValue, setInputValue] = useState('')
    const [sessionTime, setSessionTime] = useState(0)

    const handleSend = () => {
        if (inputValue.trim()) {
            console.log('Sending message:', inputValue)
            setInputValue('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    return (
        <div className="min-h-screen bg-slate-800 text-white p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Interaction Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Section */}
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-white">
                            Ditto — Safe & Balanced AI
                        </h1>
                        <p className="text-white/80 text-lg">
                            Emotional support with wellbeing nudges, adaptive understanding, and safe human collaboration.
                        </p>
                    </div>

                    {/* AI Companion Chat Area */}
                    <div className="bg-slate-700/50 rounded-xl p-6 space-y-4">
                        {/* Ditto Profile */}
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">Ditto</h3>
                                <p className="text-gray-300 text-sm">Mood: neutral</p>
                            </div>
                        </div>

                        {/* Status/Mode */}
                        <div className="text-gray-300 text-sm">
                            Balance Mode • Usage nudges enabled
                        </div>

                        {/* Instruction/Prompt */}
                        <div className="text-white/80">
                            Start a conversation — Ditto will gently suggest{' '}
                            <span className="bg-gray-600 text-gray-200 px-3 py-1 rounded-full text-sm">
                                AI Companion — Full Stack Implementation
                            </span>{' '}
                            when needed.
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="space-y-3">
                        <div className="flex space-x-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="How are you feeling? Ask or share something..."
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                            >
                                Send
                            </button>
                        </div>

                        {/* Session Status */}
                        <div className="text-gray-400 text-sm">
                            • Session timer: {sessionTime}m • Break suggestion: after 25 min
                        </div>
                    </div>
                </div>

                {/* Right Column - Informational Cards */}
                <div className="space-y-4">
                    {/* Session Today Card */}
                    <div className="bg-slate-700/50 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-2">Session today</h3>
                        <div className="text-2xl font-bold text-white">
                            0 sessions • 0 minutes
                        </div>
                    </div>

                    {/* Adaptive Emotional Intelligence Card */}
                    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <h3 className="text-white font-semibold">Adaptive Emotional Intelligence</h3>
                        <p className="text-gray-300 text-sm">
                            We detect mood trends and personalize coping strategies.
                        </p>
                        <div className="space-y-2">
                            <div className="text-gray-300 text-sm">Mood: neutral</div>
                            <div className="text-gray-400 text-xs">Last check: a few minutes ago</div>
                        </div>
                        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                            View Insights
                        </button>
                    </div>

                    {/* Community Card */}
                    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <h3 className="text-white font-semibold">Community (Opt-in)</h3>
                        <p className="text-gray-300 text-sm">
                            Join moderated peer groups — AI + human moderation ensures safety.
                        </p>
                        <div className="text-gray-300 text-sm">
                            No groups yet — create a moderated circle.
                        </div>
                        <button className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                            Create a new safe circle
                        </button>
                    </div>

                    {/* Safety & Privacy Card */}
                    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <h3 className="text-white font-semibold">Safety & Privacy</h3>
                        <p className="text-gray-300 text-sm">
                            On-device memory controls • PII scrubber • Human review opt-in
                        </p>
                        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                            Manage Privacy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
