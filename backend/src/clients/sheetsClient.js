  const { google } = require('googleapis');

class SheetsClient {
  constructor() {
    if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      throw new Error('Google Sheets credentials are required');
    }

    // Initialize Google Auth
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  }

  /**
   * Initialize the spreadsheet with headers if it doesn't exist
   */
  async initializeSpreadsheet() {
    try {
      console.log('📊 Initializing Google Sheets...');
      
      // Check if the sheet exists and has headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A1:H1',
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'A1:H1',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              'Timestamp',
              'Subreddit',
              'Post Title',
              'Post Body',
              'Post URL',
              'Gemini Solution',
              'User Rating',
              'Feedback'
            ]]
          },
        });
        
        console.log('✅ Headers added to spreadsheet');
      }
      
    } catch (error) {
      console.error('❌ Error initializing spreadsheet:', error.message);
      throw new Error(`Failed to initialize spreadsheet: ${error.message}`);
    }
  }

  /**
   * Create a user-specific sheet if it doesn't exist
   * @param {string} userId - User ID
   * @param {string} username - Username for sheet naming
   */
  async createUserSheet(userId, username) {
    try {
      // Create a clean sheet name (remove special characters, limit length)
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const sheetName = `user_${cleanUsername}_${userId.substring(0, 8)}`;

      console.log(`📋 Creating user sheet: ${sheetName}`);

      // Check if sheet already exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheet = spreadsheet.data.sheets.find(
        sheet => sheet.properties.title === sheetName
      );

      if (existingSheet) {
        console.log(`✅ User sheet already exists: ${sheetName}`);
        return sheetName;
      }

      // Create new sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          }]
        }
      });

      // Add headers to the new sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:I1`,
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'Timestamp',
            'User ID',
            'Username',
            'Subreddit',
            'Post Title',
            'Post URL',
            'Gemini Solution',
            'User Rating',
            'Feedback'
          ]]
        },
      });

      // Format the sheet for better readability
      await this.formatUserSheet(sheetName);

      console.log(`✅ User sheet created successfully: ${sheetName}`);
      return sheetName;

    } catch (error) {
      console.error('❌ Error creating user sheet:', error.message);
      throw new Error(`Failed to create user sheet: ${error.message}`);
    }
  }

  /**
   * Format user sheet for better readability
   * @param {string} sheetName - Name of the sheet to format
   */
  async formatUserSheet(sheetName) {
    try {
      console.log(`🎨 Formatting sheet: ${sheetName}`);

      // Get sheet ID
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found`);
      }

      const sheetId = sheet.properties.sheetId;

      // Apply formatting
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            // Header row formatting
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 9
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 12,
                      bold: true
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
              }
            },
            // Column widths - Much wider for better readability
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
                properties: { pixelSize: 180 }, // Timestamp - wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
                properties: { pixelSize: 120 }, // User ID - wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
                properties: { pixelSize: 150 }, // Username - wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
                properties: { pixelSize: 120 }, // Subreddit - wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
                properties: { pixelSize: 400 }, // Post Title - much wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 },
                properties: { pixelSize: 300 }, // Post URL - wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 },
                properties: { pixelSize: 800 }, // Gemini Solution - even wider for content
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 },
                properties: { pixelSize: 120 }, // User Rating - wider
                fields: 'pixelSize'
              }
            },
            {
              updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 },
                properties: { pixelSize: 350 }, // Feedback - much wider
                fields: 'pixelSize'
              }
            },
            // Freeze header row
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheetId,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                },
                fields: 'gridProperties.frozenRowCount'
              }
            }
          ]
        }
      });

      console.log(`✅ Sheet formatting applied successfully: ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error formatting sheet: ${error.message}`);
      // Don't throw error for formatting issues - sheet creation should still succeed
    }
  }

  /**
   * Format a data row for better readability
   * @param {string} sheetName - Name of the sheet
   * @param {string} range - Range of the newly added row
   */
  async formatDataRow(sheetName, range) {
    try {
      // Extract row number from range (e.g., "Sheet1!A2:I2" -> 2)
      const rowMatch = range.match(/(\d+):I(\d+)/);
      if (!rowMatch) return;

      const rowIndex = parseInt(rowMatch[1]) - 1; // Convert to 0-based index

      // Get sheet ID
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return;

      const sheetId = sheet.properties.sheetId;

      // Apply row formatting
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            // Data row formatting
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 0,
                  endColumnIndex: 9
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      fontSize: 11
                    },
                    verticalAlignment: 'TOP',
                    wrapStrategy: 'WRAP'
                  }
                },
                fields: 'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)'
              }
            },
            // Set row height for better text wrapping - much taller
            {
              updateDimensionProperties: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1
                },
                properties: { pixelSize: 200 }, // Increased to 200 for better solution readability
                fields: 'pixelSize'
              }
            },
            // Special formatting for solution column (wrap text)
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 6, // Solution column
                  endColumnIndex: 7
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      fontSize: 12,
                      fontFamily: 'Google Sans'
                    },
                    verticalAlignment: 'TOP',
                    wrapStrategy: 'WRAP',
                    backgroundColor: { red: 0.97, green: 0.99, blue: 1.0 } // Very light blue background
                  }
                },
                fields: 'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy,backgroundColor)'
              }
            },
            // URL column formatting (hyperlinks)
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 5, // URL column
                  endColumnIndex: 6
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      fontSize: 10,
                      foregroundColor: { red: 0.0, green: 0.0, blue: 0.8 }, // Blue color for links
                      underline: true
                    },
                    verticalAlignment: 'MIDDLE',
                    wrapStrategy: 'CLIP' // Don't wrap URLs
                  }
                },
                fields: 'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)'
              }
            },
            // Rating column formatting
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 7, // Rating column
                  endColumnIndex: 8
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      fontSize: 11,
                      bold: true
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)'
              }
            }
          ]
        }
      });

    } catch (error) {
      console.error(`❌ Error formatting data row: ${error.message}`);
      // Don't throw error for formatting issues
    }
  }

  /**
   * Apply conditional formatting for rating column
   * @param {string} sheetName - Name of the sheet
   * @param {string} rating - 'like' or 'dislike'
   * @param {string} range - Range of the newly added row
   */
  async applyRatingFormatting(sheetName, rating, range) {
    try {
      // Extract row number from range
      const rowMatch = range.match(/(\d+):I(\d+)/);
      if (!rowMatch) return;

      const rowIndex = parseInt(rowMatch[1]) - 1; // Convert to 0-based index

      // Get sheet ID
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return;

      const sheetId = sheet.properties.sheetId;

      // Choose colors based on rating
      const backgroundColor = rating === 'like'
        ? { red: 0.85, green: 0.95, blue: 0.85 } // Light green for likes
        : { red: 0.95, green: 0.85, blue: 0.85 }; // Light red for dislikes

      const textColor = rating === 'like'
        ? { red: 0.0, green: 0.6, blue: 0.0 } // Dark green for likes
        : { red: 0.8, green: 0.0, blue: 0.0 }; // Dark red for dislikes

      // Apply rating-specific formatting
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 7, // Rating column
                  endColumnIndex: 8
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: backgroundColor,
                    textFormat: {
                      foregroundColor: textColor,
                      fontSize: 11,
                      bold: true
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
              }
            }
          ]
        }
      });

    } catch (error) {
      console.error(`❌ Error applying rating formatting: ${error.message}`);
      // Don't throw error for formatting issues
    }
  }

  /**
   * Format solution text for better readability in Google Sheets
   * @param {string} solution - The AI solution text
   * @returns {string} Formatted solution text
   */
  formatSolutionText(solution) {
    if (!solution || typeof solution !== 'string') {
      return solution;
    }

    // Clean up the solution text for better readability
    let formatted = solution
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Add proper line breaks after sentences
      .replace(/\. /g, '.\n\n')
      // Add line breaks after colons (for lists)
      .replace(/: /g, ':\n')
      // Add line breaks before numbered lists
      .replace(/(\d+\. )/g, '\n$1')
      // Add line breaks before bullet points
      .replace(/([•\-\*] )/g, '\n$1')
      // Clean up multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return formatted;
  }

  /**
   * Log a response to user-specific Google Sheet
   * @param {Object} data - Data to log
   * @param {Object} data.post - Reddit post object
   * @param {string} data.solution - Gemini generated solution
   * @param {string} data.rating - User rating ('like' or 'dislike')
   * @param {string} data.feedback - Optional user feedback
   * @param {string} data.userId - User ID
   * @param {string} data.username - Username
   */
  async logResponse(data) {
    try {
      console.log(`📝 Logging response to user-specific Google Sheet...`);

      const { post, solution, rating, feedback = '', userId, username } = data;

      // Create or get user sheet
      const sheetName = await this.createUserSheet(userId, username);

      const timestamp = new Date().toISOString();

      // Format solution text for better readability in sheets
      const formattedSolution = this.formatSolutionText(solution);

      const row = [
        timestamp,
        userId,
        username,
        post.subreddit,
        post.title,
        post.url, // Just the plain URL
        formattedSolution,
        rating,
        feedback
      ];

      // Append the data
      const appendResult = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:I`,
        valueInputOption: 'USER_ENTERED', // USER_ENTERED makes URLs automatically clickable
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [row]
        },
      });

      // Format the newly added row
      await this.formatDataRow(sheetName, appendResult.data.updates.updatedRange);

      // Apply conditional formatting for rating
      await this.applyRatingFormatting(sheetName, rating, appendResult.data.updates.updatedRange);

      console.log(`✅ Response logged successfully to ${sheetName}`);

      return {
        success: true,
        timestamp,
        sheetName,
        rowData: row
      };

    } catch (error) {
      console.error('❌ Error logging to sheets:', error.message);
      throw new Error(`Failed to log response: ${error.message}`);
    }
  }

  /**
   * Get statistics from user-specific sheet
   * @param {string} userId - User ID
   * @param {string} username - Username
   * @returns {Object} - Statistics about logged responses for the user
   */
  async getUserStatistics(userId, username) {
    try {
      console.log(`📈 Fetching user statistics from Google Sheets for ${username}...`);

      // Get user sheet name
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const sheetName = `user_${cleanUsername}_${userId.substring(0, 8)}`;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:I`,
      });

      const rows = response.data.values || [];

      if (rows.length <= 1) {
        return {
          totalResponses: 0,
          likes: 0,
          dislikes: 0,
          topSubreddits: [],
          recentActivity: []
        };
      }

      // Skip header row
      const dataRows = rows.slice(1);

      const stats = {
        totalResponses: dataRows.length,
        likes: dataRows.filter(row => row[7] === 'like').length, // Rating is now column 7
        dislikes: dataRows.filter(row => row[7] === 'dislike').length,
        topSubreddits: this.getTopSubreddits(dataRows, 3), // Subreddit is now column 3
        recentActivity: this.getRecentActivity(dataRows, true) // Pass true for user-specific format
      };

      console.log('✅ User statistics fetched successfully');
      return stats;

    } catch (error) {
      console.error('❌ Error fetching user statistics:', error.message);
      // Return empty stats if user sheet doesn't exist yet
      return {
        totalResponses: 0,
        likes: 0,
        dislikes: 0,
        topSubreddits: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get statistics from all sheets (admin/global view)
   * @returns {Object} - Statistics about logged responses across all users
   */
  async getStatistics() {
    try {
      console.log('📈 Fetching global statistics from Google Sheets...');

      // Get all sheets in the spreadsheet
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const userSheets = spreadsheet.data.sheets.filter(
        sheet => sheet.properties.title.startsWith('user_')
      );

      let totalStats = {
        totalResponses: 0,
        likes: 0,
        dislikes: 0,
        topSubreddits: {},
        recentActivity: []
      };

      // Aggregate data from all user sheets
      for (const sheet of userSheets) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `${sheet.properties.title}!A:I`,
          });

          const rows = response.data.values || [];
          if (rows.length <= 1) continue;

          const dataRows = rows.slice(1);
          totalStats.totalResponses += dataRows.length;
          totalStats.likes += dataRows.filter(row => row[7] === 'like').length;
          totalStats.dislikes += dataRows.filter(row => row[7] === 'dislike').length;

          // Aggregate subreddits
          dataRows.forEach(row => {
            const subreddit = row[3];
            if (subreddit) {
              totalStats.topSubreddits[subreddit] = (totalStats.topSubreddits[subreddit] || 0) + 1;
            }
          });

          // Add to recent activity
          totalStats.recentActivity.push(...dataRows.slice(-5).map(row => ({
            timestamp: row[0],
            username: row[2],
            subreddit: row[3],
            title: row[4],
            rating: row[7]
          })));

        } catch (sheetError) {
          console.warn(`⚠️ Could not read sheet ${sheet.properties.title}:`, sheetError.message);
        }
      }

      // Convert topSubreddits object to sorted array
      totalStats.topSubreddits = Object.entries(totalStats.topSubreddits)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([subreddit, count]) => ({ subreddit, count }));

      // Sort recent activity by timestamp and take last 20
      totalStats.recentActivity = totalStats.recentActivity
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

      console.log('✅ Global statistics fetched successfully');
      return totalStats;

    } catch (error) {
      console.error('❌ Error fetching global statistics:', error.message);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  /**
   * Get top subreddits by response count
   * @param {Array} dataRows - Array of data rows
   * @param {number} subredditColumn - Column index for subreddit (default 1 for old format, 3 for new format)
   * @returns {Array} - Top subreddits with counts
   */
  getTopSubreddits(dataRows, subredditColumn = 1) {
    const subredditCounts = {};

    dataRows.forEach(row => {
      const subreddit = row[subredditColumn];
      if (subreddit) {
        subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
      }
    });

    return Object.entries(subredditCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([subreddit, count]) => ({ subreddit, count }));
  }

  /**
   * Get recent activity (last 10 responses)
   * @param {Array} dataRows - Array of data rows
   * @param {boolean} isUserSpecific - Whether this is for user-specific format
   * @returns {Array} - Recent activity data
   */
  getRecentActivity(dataRows, isUserSpecific = false) {
    return dataRows
      .slice(-10)
      .reverse()
      .map(row => {
        if (isUserSpecific) {
          return {
            timestamp: row[0],
            subreddit: row[3],
            title: row[4],
            rating: row[7]
          };
        } else {
          return {
            timestamp: row[0],
            subreddit: row[1],
            title: row[2],
            rating: row[6]
          };
        }
      });
  }

  /**
   * Clear all data from the spreadsheet (keep headers)
   */
  async clearData() {
    try {
      console.log('🗑️ Clearing spreadsheet data...');
      
      // Get the current data to determine range
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:H',
      });

      const rows = response.data.values || [];
      
      if (rows.length > 1) {
        // Clear everything except headers
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
          range: `A2:H${rows.length}`,
        });
        
        console.log('✅ Data cleared successfully');
      }
      
    } catch (error) {
      console.error('❌ Error clearing data:', error.message);
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }

  /**
   * Test the connection to Google Sheets
   * @returns {boolean} - True if connection is successful
   */
  async testConnection() {
    try {
      console.log('🔗 Testing Google Sheets connection...');
      
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      console.log(`✅ Connected to spreadsheet: "${response.data.properties.title}"`);
      return true;
      
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error.message);
      return false;
    }
  }
}

module.exports = SheetsClient;
