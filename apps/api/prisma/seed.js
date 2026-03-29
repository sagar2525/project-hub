const {
  PrismaClient,
  Priority,
  ProjectStatus,
  TicketStatus,
} = require('@prisma/client');

const prisma = new PrismaClient();

const projectBlueprints = [
  {
    name: 'E-Commerce Platform',
    description: 'Customer storefront, checkout, and order management platform.',
    status: ProjectStatus.ACTIVE,
    tickets: [
      {
        title: 'Fix login bug on storefront',
        description: 'Users are occasionally redirected back to login after successful authentication.',
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        comments: [
          ['Sagar', 'Reproduced the issue locally with stale session cookies.'],
          ['Mentor', 'Please verify the middleware flow before patching it.'],
          ['QA', 'Observed more often on Safari than Chrome.'],
        ],
      },
      {
        title: 'Payment gateway timeout on checkout',
        description: 'Checkout requests time out after 30 seconds for some orders.',
        status: TicketStatus.TODO,
        priority: Priority.URGENT,
        comments: [
          ['Sagar', 'The timeout seems higher when coupon validation is enabled.'],
          ['Product', 'This blocks conversion, so it needs a same-day update.'],
          ['Backend Lead', 'Check whether the retry logic is stacking duplicate requests.'],
        ],
      },
      {
        title: 'Add cart summary skeleton loader',
        description: 'Improve perceived performance while cart totals are recalculated.',
        status: TicketStatus.IN_REVIEW,
        priority: Priority.MEDIUM,
        comments: [
          ['Designer', 'Use the same spacing scale as the product cards.'],
          ['Sagar', 'Loader is implemented, pending visual QA.'],
          ['Mentor', 'Make sure the total row does not shift after hydration.'],
        ],
      },
      {
        title: 'Audit discount code validation',
        description: 'Discount rules are inconsistent across guest and signed-in users.',
        status: TicketStatus.TODO,
        priority: Priority.HIGH,
        comments: [
          ['Support', 'We had three complaints about codes failing on mobile checkout.'],
          ['Sagar', 'I found mismatched rule ordering in the validation service.'],
          ['Mentor', 'Document edge cases before refactoring the validator.'],
        ],
      },
      {
        title: 'Refactor product image optimization',
        description: 'Large product images are affecting category page performance.',
        status: TicketStatus.DONE,
        priority: Priority.MEDIUM,
        comments: [
          ['Sagar', 'Switched to responsive image sizes and added missing width hints.'],
          ['QA', 'Lighthouse score improved by 11 points on category pages.'],
          ['Mentor', 'Looks good, close this after deployment verification.'],
        ],
      },
      {
        title: 'Track abandoned cart events',
        description: 'Send analytics events when users leave checkout before payment.',
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        comments: [
          ['Analytics', 'Need event payload to include cart value and item count.'],
          ['Sagar', 'Client event is firing; backend ingestion still pending.'],
          ['Mentor', 'Add a note about consent mode handling.'],
        ],
      },
      {
        title: 'Improve order history pagination',
        description: 'Order history becomes slow for users with more than 100 orders.',
        status: TicketStatus.TODO,
        priority: Priority.LOW,
        comments: [
          ['Support', 'Heavy users are reporting blank states after page 5.'],
          ['Sagar', 'Cursor pagination should simplify the query pattern here.'],
          ['Backend Lead', 'Coordinate with API pagination changes before shipping UI updates.'],
        ],
      },
      {
        title: 'Add retry banner for failed payments',
        description: 'Surface a clear recovery path when payment confirmation fails.',
        status: TicketStatus.IN_REVIEW,
        priority: Priority.HIGH,
        comments: [
          ['Designer', 'Banner copy should reassure users that no double charge occurred.'],
          ['Sagar', 'Added retry action and support contact link.'],
          ['QA', 'Need one more pass on responsive layout in narrow screens.'],
        ],
      },
    ],
  },
  {
    name: 'Mobile App Redesign',
    description: 'Refresh the mobile app UX for onboarding, profile, and discovery flows.',
    status: ProjectStatus.ACTIVE,
    tickets: [
      {
        title: 'Redesign onboarding flow visuals',
        description: 'Replace the old onboarding screens with the new card-based design.',
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        comments: [
          ['Designer', 'Final illustrations are ready in Figma.'],
          ['Sagar', 'Implemented screen 1 and 2, still wiring the final CTA.'],
          ['Mentor', 'Keep animation timing under 250ms to avoid sluggishness.'],
        ],
      },
      {
        title: 'Fix avatar upload cropping issue',
        description: 'Uploaded avatars are zoomed incorrectly on Android devices.',
        status: TicketStatus.TODO,
        priority: Priority.MEDIUM,
        comments: [
          ['QA', 'Issue reproduces on Pixel 6 and Samsung S23.'],
          ['Sagar', 'Cropping library is applying device pixel ratio twice.'],
          ['Mentor', 'Check whether iOS has the same code path hidden behind flags.'],
        ],
      },
      {
        title: 'Improve push notification permission prompt',
        description: 'Permission prompt copy needs to align with the updated retention messaging.',
        status: TicketStatus.DONE,
        priority: Priority.LOW,
        comments: [
          ['Product', 'Copy approved after legal review.'],
          ['Sagar', 'Prompt now appears after value explanation screen.'],
          ['QA', 'Verified on both Android and iOS staging builds.'],
        ],
      },
      {
        title: 'Optimize profile tab render performance',
        description: 'Profile tab has jank when loading recent activity and saved items.',
        status: TicketStatus.IN_REVIEW,
        priority: Priority.HIGH,
        comments: [
          ['Sagar', 'Deferred non-critical sections and reduced rerenders.'],
          ['Mentor', 'Please capture before/after profiling screenshots.'],
          ['QA', 'Scrolling feels smoother on lower-end Android devices now.'],
        ],
      },
      {
        title: 'Add empty state for saved items',
        description: 'Users without saved items currently see a blank screen.',
        status: TicketStatus.DONE,
        priority: Priority.LOW,
        comments: [
          ['Designer', 'Use the neutral illustration set, not the marketing one.'],
          ['Sagar', 'Empty state shipped with CTA to explore recommendations.'],
          ['Mentor', 'Close after confirming analytics event on CTA click.'],
        ],
      },
      {
        title: 'Refine bottom navigation spacing',
        description: 'Spacing does not match updated visual rhythm in the redesign system.',
        status: TicketStatus.TODO,
        priority: Priority.MEDIUM,
        comments: [
          ['Designer', 'New spacing tokens are documented in the mobile design kit.'],
          ['Sagar', 'Will batch this with the safe-area cleanup task.'],
          ['Mentor', 'Avoid changing hit targets while adjusting layout.'],
        ],
      },
      {
        title: 'Implement search suggestions sheet',
        description: 'Show recent and suggested searches in a bottom sheet UI.',
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        comments: [
          ['Product', 'Need recent searches and trending topics in the first iteration.'],
          ['Sagar', 'Sheet interactions are working; analytics tags still missing.'],
          ['Mentor', 'Make sure keyboard handling does not hide suggestion rows.'],
        ],
      },
      {
        title: 'Stabilize deep link to referral screen',
        description: 'Deep links from campaigns sometimes open the app home screen instead.',
        status: TicketStatus.IN_REVIEW,
        priority: Priority.URGENT,
        comments: [
          ['Growth', 'This is affecting the referral campaign launch metrics.'],
          ['Sagar', 'Added fallback parsing for malformed query params.'],
          ['QA', 'Need final confirmation with production-like campaign URLs.'],
        ],
      },
    ],
  },
  {
    name: 'API Gateway Migration',
    description: 'Move legacy services behind the new API gateway with observability and auth.',
    status: ProjectStatus.ACTIVE,
    tickets: [
      {
        title: 'Migrate auth service routes',
        description: 'Point authentication traffic to the gateway without breaking token refresh.',
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        comments: [
          ['Backend Lead', 'Refresh token flow is the highest migration risk.'],
          ['Sagar', 'Gateway route is live in staging with one issue on refresh headers.'],
          ['Mentor', 'Log upstream header transformations before enabling production traffic.'],
        ],
      },
      {
        title: 'Set up gateway request tracing',
        description: 'Add correlation IDs and request tracing for downstream services.',
        status: TicketStatus.DONE,
        priority: Priority.HIGH,
        comments: [
          ['Observability', 'Tracing now appears in the shared dashboard.'],
          ['Sagar', 'Propagation works across auth and billing services.'],
          ['Mentor', 'Document the trace ID format for other teams.'],
        ],
      },
      {
        title: 'Backfill rate-limit policies',
        description: 'Legacy endpoints need explicit rate limits before migration cutover.',
        status: TicketStatus.TODO,
        priority: Priority.HIGH,
        comments: [
          ['Security', 'Public endpoints must have conservative defaults.'],
          ['Sagar', 'Collected usage baselines from the old gateway logs.'],
          ['Mentor', 'Split internal and public route groups before setting thresholds.'],
        ],
      },
      {
        title: 'Validate webhook signature passthrough',
        description: 'Payment webhooks fail if the raw body is altered by the gateway.',
        status: TicketStatus.IN_REVIEW,
        priority: Priority.URGENT,
        comments: [
          ['Payments', 'Signature verification is failing on the new path.'],
          ['Sagar', 'Disabled body parsing for the webhook route in staging.'],
          ['QA', 'Waiting on one more signed payload sample from the provider.'],
        ],
      },
      {
        title: 'Document rollback procedure',
        description: 'Ops team needs a clear rollback checklist for the migration window.',
        status: TicketStatus.DONE,
        priority: Priority.MEDIUM,
        comments: [
          ['Ops', 'Rollback doc is now linked from the release checklist.'],
          ['Sagar', 'Added decision points and smoke tests after rollback.'],
          ['Mentor', 'Good enough for the migration dry run.'],
        ],
      },
      {
        title: 'Tune gateway caching headers',
        description: 'Cache-control headers are inconsistent across proxied services.',
        status: TicketStatus.TODO,
        priority: Priority.MEDIUM,
        comments: [
          ['Frontend', 'Stale responses are causing confusion in account screens.'],
          ['Sagar', 'Need a route-by-route cache policy matrix first.'],
          ['Mentor', 'Coordinate with CDN settings before changing defaults.'],
        ],
      },
      {
        title: 'Add health aggregation endpoint',
        description: 'Expose one gateway endpoint that summarizes downstream service health.',
        status: TicketStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        comments: [
          ['Ops', 'This will simplify deployment checks.'],
          ['Sagar', 'Auth and billing health are wired in; inventory still pending.'],
          ['Mentor', 'Avoid blocking the endpoint on one slow dependency.'],
        ],
      },
      {
        title: 'Cut over reporting service traffic',
        description: 'Switch reporting APIs to gateway-routed traffic after canary validation.',
        status: TicketStatus.TODO,
        priority: Priority.HIGH,
        comments: [
          ['Analytics', 'Canary results look stable so far.'],
          ['Sagar', 'Need one more load test before full cutover.'],
          ['Mentor', 'Prepare a rollback route map before scheduling the cutover.'],
        ],
      },
    ],
  },
];

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
  await prisma.embedding.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();

  let projectCount = 0;
  let ticketCount = 0;
  let commentCount = 0;

  for (const projectBlueprint of projectBlueprints) {
    const project = await prisma.project.create({
      data: {
        name: projectBlueprint.name,
        description: projectBlueprint.description,
        status: projectBlueprint.status,
      },
    });

    projectCount += 1;

    for (const ticketBlueprint of projectBlueprint.tickets) {
      const ticket = await prisma.ticket.create({
        data: {
          projectId: project.id,
          title: ticketBlueprint.title,
          description: ticketBlueprint.description,
          status: ticketBlueprint.status,
          priority: ticketBlueprint.priority,
        },
      });

      ticketCount += 1;

      await prisma.comment.createMany({
        data: ticketBlueprint.comments.map(([author, content]) => ({
          ticketId: ticket.id,
          author,
          content,
        })),
      });

      commentCount += ticketBlueprint.comments.length;
    }
  }

  console.log(
    `Seed complete: ${projectCount} projects, ${ticketCount} tickets, ${commentCount} comments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
