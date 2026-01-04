# Short URL System

This site supports short URLs that redirect to longer destinations.

## How it Works

1. Short links are defined in [data/shortlinks.json](data/shortlinks.json)
2. A build script generates static pages at `/s/:id`
3. Each page redirects to the configured destination URL

## Adding a New Short Link

1. Edit `data/shortlinks.json` and add a new entry:

```json
{
  "example": "https://example.com",
  "gh": "https://github.com/frankmarazita"
}
```

2. Run the generation script:

```bash
node scripts/generate-shortlinks.js
```

3. The page will be available at `/s/example` and redirect to the configured URL

## Build Process

The GitHub Actions workflow automatically runs the generation script before building the site, so you only need to update `data/shortlinks.json` and commit the changes.

## Local Development

When developing locally, run the generation script before starting Hugo:

```bash
node scripts/generate-shortlinks.js
hugo server
```
