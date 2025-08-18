# react-ui

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/aaron-wilson/react-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/aaron-wilson/react-ui/actions)

> A modern, TypeScript-first React UI framework built with Next.js, Vite, and GraphQL, optimized for scalability, developer experience, and performance.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Observability](#observability)
- [Optional Features](#optional-features)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

`react-ui` is a frontend UI framework designed for modern web applications. It emphasizes type safety, developer productivity, and high performance by leveraging TypeScript, Next.js, and Vite.  

Key features:

- **React + Next.js App Router** with server actions for modern SSR and client interactivity.
- **Typed GraphQL integration** using `urql` for lightweight and scalable data fetching.
- **Tailwind CSS** for utility-first, responsive styling.
- **Vite** for fast builds, HMR, and modern module bundling.
- **Robust testing setup** with `Vitest` for unit and component tests, and `Playwright` for browser end-to-end tests.
- **CI/CD pipeline** with GitHub Actions deploying via CDK to S3 + CloudFront.
- **Observability** through Sentry for error tracking and performance monitoring.
- **Optional modern niceties**: MDX documentation support and image optimization.

---

## Tech Stack

| Layer | Technology | Reasoning / Explanation |
|-------|------------|------------------------|
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Provides static typing, enhanced IDE support, and safer code refactoring. |
| **Framework / Runtime** | [React](https://reactjs.org/) + [Next.js](https://nextjs.org/) (App Router / Server Actions) | Next.js enables server-side rendering, static site generation, and API routes, while React provides a component-driven UI model. Server Actions allow direct server mutations from the frontend. |
| **Build Tool** | [Vite](https://vitejs.dev/) | Extremely fast bundler and dev server with native ES modules, optimized for modern frameworks like React and Next.js. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework that reduces CSS bloat and improves responsive styling workflow. |
| **GraphQL Client** | [urql](https://formidable.com/open-source/urql/) | Lightweight, modern, and fully typed GraphQL client. Provides simplicity over Apollo in small-to-medium projects. |
| **Unit & Component Testing** | [Vitest](https://vitest.dev/) | Fast, Vite-integrated testing framework for unit and component testing. |
| **End-to-End Testing** | [Playwright](https://playwright.dev/) | Reliable E2E browser testing across Chromium, Firefox, and WebKit. Supports CI integration and multi-browser scenarios. |
| **CI/CD** | GitHub Actions → [AWS CDK](https://aws.amazon.com/cdk/) deploy to [S3](https://aws.amazon.com/s3/) + [CloudFront](https://aws.amazon.com/cloudfront/) | Automates build, test, and deployment pipelines. CDK provides infrastructure as code for reproducible deployments. |
| **Observability** | [Sentry](https://sentry.io/) | Frontend error tracking, performance monitoring, and real-time alerting. |
| **Optional / Modern Niceties** | [MDX](https://mdxjs.com/) | Allows embedding JSX components inside markdown, useful for documentation pages. |
|  | Vite Image Optimization Plugins | Optimizes images during build for better performance. CloudFront provides global CDN caching. |

---

## Getting Started

### Prerequisites

- [Node.js >= 20](https://nodejs.org/)
- [pnpm](https://pnpm.io/) for fast, deterministic package management
- [Git](https://git-scm.com/)

### Local Development

```bash
# Clone the repo
git clone https://github.com/your-org/react-ui.git
cd react-ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
````

The dev server supports hot module replacement (HMR) and React Fast Refresh.

---

## Configuration

Environment variables can be configured via a `.env` file:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/graphql
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

* `NEXT_PUBLIC_API_URL`: URL for GraphQL API
* `SENTRY_DSN`: Sentry Data Source Name for frontend error tracking

---

## Testing

### Unit / Component Tests

Vitest is integrated for fast local testing:

```bash
pnpm test
pnpm test:watch
```

### End-to-End Tests

Playwright runs full browser tests:

```bash
pnpm e2e
pnpm e2e:headed # Runs in visible browser mode
```

---

## CI/CD

The repository is configured with GitHub Actions to:

1. Run unit, component, and E2E tests.
2. Build the project with Vite.
3. Deploy to S3 + CloudFront via AWS CDK.

Workflow example: `.github/workflows/ci.yml`

---

## Observability

Sentry is configured for:

* Capturing runtime errors
* Monitoring frontend performance metrics
* Alerting via Slack/email

Setup: configure `SENTRY_DSN` in environment variables.

---

## Optional Features

* **MDX Documentation Pages**: Create `.mdx` files in `/docs` to render interactive documentation.
* **Image Optimization**: Vite plugins optimize images during build; CloudFront serves them globally with caching.

---

## Contributing

We welcome contributions! Please follow our guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
