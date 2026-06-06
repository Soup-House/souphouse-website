// @ts-ignore
import { defineCollection, z } from 'astro:content'
import { glob, file } from 'astro/loaders'

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.(md|mdx|mdoc|yaml|json)', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      featuredImage: image().optional(),
      imageAlt: z.string().optional(),
      excerpt: z.string().optional(),
      publishedDate: z.date().optional(),
    }),
})

const branding = defineCollection({
  loader: file('./src/settings/branding.json'),
  schema: z.object({
    siteName: z.string(),
    theme: z.string(),
    favicon: z.string(),
  }),
})

const seo = defineCollection({
  loader: file('./src/settings/seo.json'),
  schema: ({ image }) =>
    z.object({
      seo: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.string().optional(),
        canonical: z.string().optional(),
      }).optional(),
      opengraph: z
        .object({
          Title: z.string().optional(),
          Description: z.string().optional(),
          Image: image().optional(),
        })
        .optional(),
      twitter: z
        .object({
          Title: z.string().optional(),
          Description: z.string().optional(),
          Image: image().optional(),
        })
        .optional(),
    }),
})

const button = z.object({
  label: z.string(),
  link: z.string(),
  icon: z.string().optional().default(''),
  style: z.string().optional().default('primary'),
  type: z.string().optional().default(''),
  size: z.string().optional().default(''),
})

const pages = defineCollection({
  loader: glob({ pattern: '**/[^_]*.json', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      blocks: z
        .array(
          z.discriminatedUnion('discriminant', [
            z.object({
              discriminant: z.literal('hero'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string(),
                subheading: z.string().optional(),
                intro: z.string().optional(),
                image: image().nullable().optional(),
                imageAlt: z.string().optional(),
                buttons: z.array(button).optional().default([]),
              }),
            }),
            z.object({
              discriminant: z.literal('header'),
              value: z.object({
                anchorId: z.string().optional(),
                eyebrow: z.string().optional(),
                heading: z.string(),
                subheading: z.string().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('split'),
              value: z.object({
                anchorId: z.string().optional(),
                eyebrow: z.string().optional(),
                heading: z.string().optional(),
                body: z.string().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('prose'),
              value: z.object({
                anchorId: z.string().optional(),
                eyebrow: z.string().optional(),
                heading: z.string().optional(),
                body: z.string().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('cards'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                subheading: z.string().optional(),
                items: z
                  .array(
                    z.object({
                      icon: z.string().optional().default(''),
                      title: z.string(),
                      body: z.string().optional(),
                      link: z.string().optional().default(''),
                      linkLabel: z.string().optional().default(''),
                    })
                  )
                  .optional()
                  .default([]),
              }),
            }),
            z.object({
              discriminant: z.literal('steps'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                subheading: z.string().optional(),
                items: z
                  .array(
                    z.object({
                      title: z.string(),
                      body: z.string().optional(),
                    })
                  )
                  .optional()
                  .default([]),
              }),
            }),
            z.object({
              discriminant: z.literal('calendar'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                subheading: z.string().optional(),
                source: z.string().optional(),
                tags: z.string().optional(),
                max: z.number().nullable().optional(),
                showList: z.boolean().optional(),
                showCalendar: z.boolean().optional(),
                showMap: z.boolean().optional(),
                defaultTab: z.string().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('postsTeaser'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                subheading: z.string().optional(),
                maxPosts: z.number().nullable().optional().default(3),
              }),
            }),
            z.object({
              discriminant: z.literal('cta'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                body: z.string().optional(),
                buttons: z.array(button).optional().default([]),
              }),
            }),
            z.object({
              discriminant: z.literal('signup'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                note: z.string().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('newsletter'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                note: z.string().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('schedule'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                subheading: z.string().optional(),
                source: z.string().optional(),
                tags: z.string().optional(),
                max: z.number().nullable().optional(),
              }),
            }),
            z.object({
              discriminant: z.literal('team'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                subheading: z.string().optional(),
                members: z
                  .array(
                    z.object({
                      name: z.string().optional(),
                      role: z.string().optional(),
                      bio: z.string().optional(),
                      photo: image().nullable().optional(),
                    })
                  )
                  .optional()
                  .default([]),
              }),
            }),
            z.object({
              discriminant: z.literal('embed'),
              value: z.object({
                anchorId: z.string().optional(),
                heading: z.string().optional(),
                note: z.string().optional(),
                html: z.string().optional(),
              }),
            }),
          ])
        )
        .optional()
        .default([]),
    }),
})

export const collections = { posts, branding, seo, pages }
