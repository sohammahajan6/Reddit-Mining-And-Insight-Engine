import React, { useState } from 'react';
import { Search, Settings, ArrowRight } from 'lucide-react';

const PostCountSelector = ({ subreddit, onFetchPosts, isLoading }) => {
  const [postCount, setPostCount] = useState(10);
  const [sortBy, setSortBy] = useState('hot');

  const handleSubmit = (e) => {
    e.preventDefault();
    onFetchPosts(subreddit, sortBy, postCount);
  };

  const postCountOptions = [
    { value: 5, label: '5 posts', description: 'Quick selection' },
    { value: 10, label: '10 posts', description: 'Good variety' },
    { value: 15, label: '15 posts', description: 'More options' },
    { value: 20, label: '20 posts', description: 'Maximum choice' }
  ];

  const sortOptions = [
    { value: 'hot', label: 'Hot', description: 'Most popular right now' },
    { value: 'new', label: 'New', description: 'Most recent posts' },
    { value: 'top', label: 'Top', description: 'Highest rated today' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Fetch Posts from r/{subreddit}
            </h2>
          </div>
          <p className="text-gray-600">
            Choose how many posts to fetch and how to sort them
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Count Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Number of posts to fetch
            </label>
            <div className="grid grid-cols-2 gap-3">
              {postCountOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    postCount === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="postCount"
                    value={option.value}
                    checked={postCount === option.value}
                    onChange={(e) => setPostCount(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className={`block text-sm font-medium ${
                        postCount === option.value ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </span>
                      <span className={`block text-sm ${
                        postCount === option.value ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </span>
                    </div>
                  </div>
                  {postCount === option.value && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Sort Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sort posts by
            </label>
            <div className="grid grid-cols-3 gap-3">
              {sortOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border p-3 focus:outline-none ${
                    sortBy === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-1 flex-col text-center">
                    <span className={`block text-sm font-medium ${
                      sortBy === option.value ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </span>
                    <span className={`block text-xs mt-1 ${
                      sortBy === option.value ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {option.description}
                    </span>
                  </div>
                  {sortBy === option.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Fetching Posts...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Fetch {postCount} Posts
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCountSelector;
