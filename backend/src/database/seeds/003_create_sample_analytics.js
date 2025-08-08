const { v4: uuidv4 } = require('uuid');

/**
 * Create sample analytics data for development
 */
exports.seed = async function(knex) {
  // Disabled - we don't want sample analytics data
  console.log('⏭️ Skipping sample analytics seed (disabled - real data only)');
  return;

  try {
    console.log('🌱 Seeding sample analytics data for development...');

    // Get sample users
    const users = await knex('users')
      .where('role', 'user')
      .select('id', 'username');

    if (users.length === 0) {
      console.log('⚠️ No users found, skipping analytics seed');
      return;
    }

    const subreddits = [
      'relationship_advice',
      'careerquestions', 
      'personalfinance',
      'askreddit',
      'advice',
      'socialskills',
      'depression',
      'anxiety'
    ];

    const templates = ['general', 'relationship', 'career', 'technical', 'social'];
    const tones = ['empathetic', 'professional', 'casual', 'direct'];
    const lengths = ['short', 'medium', 'detailed'];

    const analyticsEvents = [];
    const now = new Date();

    // Generate events for the last 30 days
    for (let day = 0; day < 30; day++) {
      const eventDate = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
      
      // Generate 3-8 events per day
      const eventsPerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < eventsPerDay; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const tone = tones[Math.floor(Math.random() * tones.length)];
        const length = lengths[Math.floor(Math.random() * lengths.length)];
        
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const postId = `post_${Math.random().toString(36).substr(2, 8)}`;
        
        // Random hour between 8 AM and 11 PM
        const hour = Math.floor(Math.random() * 15) + 8;
        const eventTime = new Date(eventDate);
        eventTime.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        // Solution generation event
        const solutionEvent = {
          id: uuidv4(),
          event_type: 'solution_generated',
          user_id: user.id,
          session_id: sessionId,
          subreddit: subreddit,
          post_id: postId,
          post_title: `Sample post from r/${subreddit}`,
          solution_template: template,
          solution_tone: tone,
          solution_length: length,
          solution_word_count: Math.floor(Math.random() * 400) + 200,
          generation_time: (Math.random() * 3 + 1).toFixed(2), // 1-4 seconds
          success: true,
          event_data: JSON.stringify({}),
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: eventTime
        };

        analyticsEvents.push(solutionEvent);

        // 70% chance of user feedback
        if (Math.random() < 0.7) {
          const isPositive = Math.random() < 0.8; // 80% positive feedback
          const feedbackTime = new Date(eventTime.getTime() + Math.random() * 300000); // Within 5 minutes

          const feedbackEvent = {
            id: uuidv4(),
            event_type: 'user_feedback',
            user_id: user.id,
            session_id: sessionId,
            subreddit: subreddit,
            post_id: postId,
            post_title: `Sample post from r/${subreddit}`,
            solution_template: template,
            solution_tone: tone,
            solution_length: length,
            solution_word_count: solutionEvent.solution_word_count,
            generation_time: solutionEvent.generation_time,
            user_rating: isPositive ? 'like' : 'dislike',
            feedback_text: isPositive 
              ? ['Great advice!', 'Very helpful', 'Exactly what I needed', 'Thank you!'][Math.floor(Math.random() * 4)]
              : ['Could be better', 'Not quite right', 'Needs improvement'][Math.floor(Math.random() * 3)],
            success: isPositive,
            event_data: JSON.stringify({}),
            ip_address: solutionEvent.ip_address,
            user_agent: solutionEvent.user_agent,
            created_at: feedbackTime
          };

          analyticsEvents.push(feedbackEvent);
        }
      }
    }

    // Add some login events
    for (const user of users) {
      for (let day = 0; day < 7; day++) {
        const loginDate = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
        loginDate.setHours(Math.floor(Math.random() * 12) + 8); // Login between 8 AM and 8 PM

        const loginEvent = {
          id: uuidv4(),
          event_type: 'user_login',
          user_id: user.id,
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          success: true,
          event_data: JSON.stringify({ loginMethod: 'email' }),
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: loginDate
        };

        analyticsEvents.push(loginEvent);
      }
    }

    // Insert analytics events in batches
    const batchSize = 100;
    for (let i = 0; i < analyticsEvents.length; i += batchSize) {
      const batch = analyticsEvents.slice(i, i + batchSize);
      await knex('analytics_events').insert(batch);
      console.log(`✅ Inserted analytics batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(analyticsEvents.length / batchSize)}`);
    }

    console.log(`✅ Sample analytics data seeded successfully (${analyticsEvents.length} events)`);

  } catch (error) {
    console.error('❌ Error seeding sample analytics:', error);
    throw error;
  }
};
