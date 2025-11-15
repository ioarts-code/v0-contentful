# Contentful Setup Guide

This application requires a Contentful space with a specific content model to work properly.

## Content Type Setup

You need to create a content type called **"Blog Post"** (API identifier: `blogPost`) in your Contentful space with the following fields:

### Required Fields:

1. **Title** (Short text)
   - Field ID: `title`
   - Required: Yes
   - Appearance: Single line

2. **Slug** (Short text)
   - Field ID: `slug`
   - Required: Yes
   - Unique: Yes
   - Appearance: Slug

3. **Date** (Date and time)
   - Field ID: `date`
   - Required: Yes

4. **Excerpt** (Long text)
   - Field ID: `excerpt`
   - Required: No

5. **Content** (Rich text)
   - Field ID: `content`
   - Required: Yes

6. **Cover Image** (Media - Single file)
   - Field ID: `coverImage`
   - Required: No
   - Accepted files: Images only

7. **Author** (Reference - Single entry)
   - Field ID: `author`
   - Required: Yes
   - Accept only specified entry type: Author

## Author Content Type

Create another content type called **"Author"** (API identifier: `author`):

1. **Name** (Short text)
   - Field ID: `name`
   - Required: Yes

2. **Picture** (Media - Single file)
   - Field ID: `picture`
   - Required: No
   - Accepted files: Images only

## Steps to Set Up:

1. Go to your Contentful space: https://app.contentful.com/spaces/vadm9ymt179e
2. Navigate to Content model in the top navigation
3. Click "Add content type" and create the "Author" content type first
4. Add the fields as specified above for Author
5. Click "Add content type" again and create the "Blog Post" content type
6. Add all the fields as specified above for Blog Post
7. Save and publish your content model
8. Add some sample content to test

## Alternative: Using Existing Content Type

If you already have a different content type in your space (like "title"), you can modify the API queries in `lib/api.ts` to use that content type instead of `blogPost`.
