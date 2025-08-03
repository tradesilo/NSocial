/**
 * Data Loader Module
 * Handles downloading and processing NSocial member data
 */

class DataLoader {
    constructor() {
        this.rawData = null;
        this.processedData = null;
        this.isLoading = false;
        this.dataUrl = 'https://n-social-data-mkin.vercel.app/intro_embeddings_openai.json';
    }

    /**
     * Download and process the NSocial data
     */
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('Loading NSocial data...');

        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.rawData = await response.json();
            console.log(`Loaded ${this.rawData.length} members`);
            
            // Process the data for better usability
            this.processedData = this.processData(this.rawData);
            
            this.isLoading = false;
            return this.processedData;
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Process raw data to make it more searchable and usable
     */
    processData(rawData) {
        return rawData.map(member => {
            const processed = {
                ...member,
                // Clean and normalize text fields
                name: this.cleanText(member.name),
                location: this.cleanText(member.location),
                professional_summary: this.cleanText(member.professional_summary),
                personal_summary: this.cleanText(member.personal_summary),
                philosophical_summary: this.cleanText(member.philosophical_summary),
                
                // Process tags
                tags: member.tags || [],
                
                // Extract searchable keywords from professional summary
                professional_keywords: this.extractKeywords(member.professional_summary),
                
                // Process location data
                location_normalized: this.normalizeLocation(member.location),
                
                // Add computed fields
                has_location: !!member.location,
                has_professional_summary: !!member.professional_summary,
                has_personal_summary: !!member.personal_summary,
                has_social_links: !!(member.x_url || member.linkedin_url || member.discord_handle),
                
                // Create searchable text for full-text search
                searchable_text: this.createSearchableText(member),
                
                // Process URLs
                social_links: this.processSocialLinks(member)
            };

            return processed;
        });
    }

    /**
     * Clean text by removing extra whitespace and escape characters
     */
    cleanText(text) {
        if (!text) return '';
        return text.replace(/\\n/g, ' ')
                  .replace(/\\\//g, '/')
                  .replace(/\s+/g, ' ')
                  .trim();
    }

    /**
     * Extract keywords from professional summary for better searchability
     */
    extractKeywords(professionalSummary) {
        if (!professionalSummary) return [];
        
        const text = professionalSummary.toLowerCase();
        const keywords = [];
        
        // Common tech/professional keywords
        const patterns = [
            /\b(developer|engineer|designer|product|manager|founder|ceo|cto|blockchain|web3|ai|machine learning|data|frontend|backend|fullstack|startup|entrepreneur)\b/g,
            /\b(react|javascript|python|solana|ethereum|bitcoin|defi|nft|crypto)\b/g,
            /\b(years?\s+of\s+experience|experience\s+in|worked\s+at|working\s+at)\b/g
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                keywords.push(...matches);
            }
        });
        
        return [...new Set(keywords)]; // Remove duplicates
    }

    /**
     * Normalize location for better grouping
     */
    normalizeLocation(location) {
        if (!location) return null;
        
        const normalized = location.toLowerCase().trim();
        
        // Common location normalizations
        const locationMappings = {
            'sf': 'san francisco',
            'bay area': 'san francisco',
            'silicon valley': 'san francisco',
            'nyc': 'new york',
            'new york city': 'new york',
            'la': 'los angeles',
            'sg': 'singapore',
            'uk': 'united kingdom',
            'usa': 'united states',
            'us': 'united states'
        };
        
        return locationMappings[normalized] || normalized;
    }

    /**
     * Create searchable text combining all relevant fields
     */
    createSearchableText(member) {
        const fields = [
            member.name,
            member.username,
            member.location,
            member.professional_summary,
            member.personal_summary,
            member.philosophical_summary,
            ...(member.tags || [])
        ];
        
        return fields.filter(field => field)
                    .join(' ')
                    .toLowerCase();
    }

    /**
     * Process social links into a structured format
     */
    processSocialLinks(member) {
        const links = {};
        
        if (member.x_url) {
            links.twitter = member.x_url.replace(/\\\//g, '/');
        }
        if (member.linkedin_url) {
            links.linkedin = member.linkedin_url.replace(/\\\//g, '/');
        }
        if (member.discord_handle) {
            links.discord = member.discord_handle;
        }
        
        return links;
    }

    /**
     * Get unique values for filter options
     */
    getFilterOptions() {
        if (!this.processedData) return null;
        
        const locations = [...new Set(
            this.processedData
                .map(m => m.location_normalized)
                .filter(l => l)
        )].sort();
        

        
        const allTags = [...new Set(
            this.processedData
                .flatMap(m => m.tags || [])
                .filter(t => t)
        )].sort();
        
        // Extract common professions from professional summaries
        const professions = this.extractProfessions();
        
        return {
            locations,
            tags: allTags,
            professions
        };
    }

    /**
     * Extract common professions for filter dropdown
     */
    extractProfessions() {
        if (!this.processedData) return [];
        
        const professionKeywords = {};
        
        this.processedData.forEach(member => {
            if (member.professional_summary) {
                const summary = member.professional_summary.toLowerCase();
                
                // Common profession patterns
                const patterns = [
                    'developer', 'engineer', 'designer', 'product manager',
                    'founder', 'ceo', 'cto', 'entrepreneur', 'consultant',
                    'data scientist', 'researcher', 'analyst', 'marketer',
                    'blockchain', 'web3', 'ai', 'machine learning'
                ];
                
                patterns.forEach(pattern => {
                    if (summary.includes(pattern)) {
                        professionKeywords[pattern] = (professionKeywords[pattern] || 0) + 1;
                    }
                });
            }
        });
        
        // Return top professions sorted by frequency
        return Object.entries(professionKeywords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([profession]) => profession);
    }

    /**
     * Get community statistics
     */
    getStats() {
        if (!this.processedData) return null;
        
        const stats = {
            totalMembers: this.processedData.length,
            totalLocations: new Set(this.processedData.map(m => m.location_normalized).filter(l => l)).size,
            totalTags: new Set(this.processedData.flatMap(m => m.tags || [])).size,
            
            // Additional insights
            membersWithLocation: this.processedData.filter(m => m.has_location).length,
            membersWithProfessional: this.processedData.filter(m => m.has_professional_summary).length,
            membersWithSocial: this.processedData.filter(m => m.has_social_links).length
        };
        
        return stats;
    }

    /**
     * Get sample of the data for testing
     */
    getSample(count = 50) {
        if (!this.processedData) return [];
        return this.processedData.slice(0, count);
    }


}

// Export for use in other modules
window.DataLoader = DataLoader;