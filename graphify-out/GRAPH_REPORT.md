# Graph Report - adhunikcropcare  (2026-07-22)

## Corpus Check
- 434 files · ~862,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2588 nodes · 4943 edges · 244 communities (183 shown, 61 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7736f9d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- users.ts
- cart-drawer.tsx
- utils.ts
- storefront-orders.ts
- cn
- database-health.ts
- storefront-auth.ts
- dashboard.tsx
- formatCurrency
- auth.ts
- index.ts
- content.engine.ts
- users-admin.tsx
- compilerOptions
- products.ts
- dependencies
- products-admin.tsx
- customers-admin.tsx
- useAuth
- sidebar.tsx
- header.tsx
- page.tsx
- analytics-insights.ts
- customers.ts
- mailer.ts
- categories.ts
- media.ts
- dashboard-data.ts
- database-admin.tsx
- page.tsx
- page.tsx
- components.json
- categories-admin.tsx
- profile-admin.tsx
- devDependencies
- inventory-admin.tsx
- page.tsx
- analytics-admin.tsx
- OryCMSContentTable.tsx
- order-notification-emails.ts
- media-library.tsx
- requireOryCMSUser
- orders-admin.tsx
- jsonError
- requireCsrf
- legal-page.tsx
- menubar.tsx
- allowScripts
- inventory.ts
- product-detail-view.tsx
- page.tsx
- orders.ts
- collection-schema-form.ts
- carousel.tsx
- scripts
- settings-admin.tsx
- tokens.repo.ts
- OryCMSDashboard
- page.tsx
- form.tsx
- route-guards.test.ts
- token-links.ts
- chart.tsx
- command.tsx
- context-menu.tsx
- dropdown-menu.tsx
- frontend-auth-page.tsx
- content-ui.test.ts
- alert-dialog.tsx
- sheet.tsx
- table.tsx
- default-memoji-avatar.tsx
- templates.ts
- OryCMSCollectionSchemaEditor.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- select.tsx
- admin-content-routes.ts
- validateEmail
- page.tsx
- PageHeader.tsx
- card.tsx
- route.ts
- route.ts
- AppSidebar.tsx
- react
- package.json
- Adhunik Crop Care Private Limited
- route.test.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- OryCMSMediaLibrary.tsx
- alert.tsx
- input-otp.tsx
- oryntic-error-reporting.ts
- utils.ts
- page.tsx
- prisma-migrate-deploy.mjs
- smart-agri-section.tsx
- testimonials-carousel.tsx
- register
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- accordion.tsx
- tabs.tsx
- announcement-bar.tsx
- route.ts
- route.ts
- sonner.tsx
- config.test.ts
- db.ts
- page.tsx
- AGENTS.md
- bcryptjs
- eslint.config.mjs
- breadcrumb.tsx
- next-auth
- collection-schema-form.test.ts
- page.tsx
- route.ts
- route.ts
- input-otp.tsx
- testimonials-carousel.tsx
- postcss.config.mjs
- check-node-version.mjs
- accordion.tsx
- tabs.tsx
- vercel.json
- route.ts
- @base-ui/react
- class-variance-authority
- clsx
- dotenv
- init
- lucide-react
- @neondatabase/serverless
- next-auth
- nodemailer
- @ory-cms/core
- @ory-cms/next
- pg
- @prisma/adapter-pg
- @prisma/client
- react-dom
- sanitize-html
- @sentry/nextjs
- shadcn
- sharp
- tailwind-merge
- @tiptap/extension-image
- @tiptap/extension-link
- @tiptap/extension-table
- @tiptap/extension-table-header
- @tiptap/extension-table-row
- @tiptap/extension-text-align
- @tiptap/pm
- @tiptap/react
- @tiptap/starter-kit
- tw-animate-css
- @types/nodemailer
- @types/sanitize-html
- @tiptap/extension-table-cell
- @tiptap/extension-underline

## God Nodes (most connected - your core abstractions)
1. `cn()` - 173 edges
2. `requireOryCMSUser()` - 112 edges
3. `ensureStorefrontAuthSchema()` - 41 edges
4. `formatCurrency()` - 40 edges
5. `jsonError()` - 35 edges
6. `requireCsrf()` - 32 edges
7. `OryCMSDashboard()` - 24 edges
8. `paymentsError()` - 24 edges
9. `useAuth()` - 22 edges
10. `CartDrawer()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `OryCMSCollectionSchemaEditor()` --indirect_call--> `slug()`  [INFERRED]
  orycms/components/collections/OryCMSCollectionSchemaEditor.tsx → src/lib/shiprocket/fulfillment.ts
- `AppSidebar()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/AppSidebar.tsx → src/lib/utils.ts
- `Card()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts
- `Delta()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts
- `Segmented()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (244 total, 61 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.06
Nodes (59): clearOryCMSHooks(), defineOryCMSHook(), getOryCMSHooks(), HookOptions, registerOryCMSHook(), unregisterOryCMSHook(), HOOK_EVENTS, buildOryCMSHookContext() (+51 more)

### Community 1 - "users.ts"
Cohesion: 0.06
Nodes (73): hashToken(), POST(), GET(), GET(), PATCH(), profileError(), DELETE(), GET() (+65 more)

### Community 2 - "cart-drawer.tsx"
Cohesion: 0.05
Nodes (36): nextConfig, .next, metadata, MILESTONES, PROMISES, VALUES, CULTURES, metadata (+28 more)

### Community 3 - "utils.ts"
Cohesion: 0.04
Nodes (30): Alert, AlertDescription, AlertTitle, alertVariants, Button, ButtonProps, buttonVariants, Checkbox (+22 more)

### Community 4 - "storefront-orders.ts"
Cohesion: 0.13
Nodes (40): sendAdminEmail(), ensureStorefrontAuthSchema(), aggregateItems(), buildInvoicePdf(), cancelOrder(), CheckoutItem, CheckoutOrderResponse, CheckoutPayload (+32 more)

### Community 5 - "cn"
Cohesion: 0.07
Nodes (31): Badge(), BadgeProps, badgeVariants, Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList (+23 more)

### Community 6 - "database-health.ts"
Cohesion: 0.06
Nodes (39): config, isSafeFromPath(), isStorefrontProtectedPath(), middleware(), PUBLIC_ORYCMS_AUTH_API, PUBLIC_ORYCMS_PAGES, Table, TableBody (+31 more)

### Community 7 - "storefront-auth.ts"
Cohesion: 0.15
Nodes (22): GET(), GET(), assertAuthSecret(), base64url(), clearAuthCookies(), cookieOptions(), createSessionCookies(), csrfResponse() (+14 more)

### Community 8 - "dashboard.tsx"
Cohesion: 0.06
Nodes (32): AlertsAndCustomers(), DashboardShell(), dateTime(), findActiveSidebarGroup(), greeting(), ICONS, Insight(), InventoryHealth() (+24 more)

### Community 9 - "formatCurrency"
Cohesion: 0.07
Nodes (24): Card(), CustomerInsights(), Delta(), ExecMetrics(), funnel, orders, OrdersOverview(), OrdersTable() (+16 more)

### Community 10 - "auth.ts"
Cohesion: 0.11
Nodes (26): authenticateOryCMSUser(), createOryCMSInitialOwner(), createOryCMSUserSession(), destroyOryCMSUserSession(), destroyOryCMSUserSessions(), OryCMSAuthError, OryCMSAuthErrorCode, getOryCMSCurrentSession() (+18 more)

### Community 11 - "index.ts"
Cohesion: 0.14
Nodes (28): ORYCMS_DEFAULT_CONFIG, loadOryCMSConfig(), loadUserConfig(), mergeOryCMSConfig(), resetOryCMSConfigCacheForTests(), OryCMSAdminConfig, OryCMSAIConfig, OryCMSAuthConfig (+20 more)

### Community 12 - "content.engine.ts"
Cohesion: 0.18
Nodes (24): createOryCMSContentEntry(), deleteOryCMSContentEntry(), deriveTable(), filterToSQL(), getOryCMSContentEntry(), listOryCMSContentEntries(), OryCMSCreateInput, OryCMSListOptions (+16 more)

### Community 13 - "users-admin.tsx"
Cohesion: 0.07
Nodes (20): AdminRole, AdminStatus, AdminUser, Avatar(), BulkButton(), ConfirmModal(), ConfirmState, dateTime() (+12 more)

### Community 14 - "compilerOptions"
Cohesion: 0.06
Nodes (32): app, components, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts (+24 more)

### Community 15 - "products.ts"
Cohesion: 0.21
Nodes (14): GET(), ordersError(), GET(), POST(), unreadError(), asRecord(), getUnreadOrderCount(), listOryCMSOrders() (+6 more)

### Community 17 - "products-admin.tsx"
Cohesion: 0.07
Nodes (16): ALLOWED_EXTENSIONS, ALLOWED_TYPES, emptyProduct, formatBytes(), formatDateTime(), LimitedField(), MediaPickerDialog(), Meta (+8 more)

### Community 18 - "customers-admin.tsx"
Cohesion: 0.09
Nodes (19): Avatar(), BulkButton(), ConfirmModal(), ConfirmState, Customer, CustomerDetails, CustomerStatus, dateTime() (+11 more)

### Community 19 - "useAuth"
Cohesion: 0.11
Nodes (18): metadata, AppProviders(), AuthModal(), ForgotPasswordForm(), inputCls(), ResetPasswordForm(), SignInForm(), SignUpForm() (+10 more)

### Community 20 - "sidebar.tsx"
Cohesion: 0.07
Nodes (28): Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+20 more)

### Community 21 - "header.tsx"
Cohesion: 0.13
Nodes (21): FIXED_NAV_LINKS, Header(), StorefrontCategory, CartContext, CartContextValue, CartItem, CartProductInput, CartProvider() (+13 more)

### Community 22 - "page.tsx"
Cohesion: 0.13
Nodes (23): AccountPage(), Address, AddressesView(), comparePrice(), EditProfileView(), fmt(), fmtDate(), formatAddress() (+15 more)

### Community 23 - "analytics-insights.ts"
Cohesion: 0.16
Nodes (22): aggregateCategories(), aggregateProducts(), between(), buildRecommendations(), byQuantity(), byRevenue(), CustomerRow, getOryCMSAnalyticsInsights() (+14 more)

### Community 24 - "customers.ts"
Cohesion: 0.19
Nodes (22): customerError(), DELETE(), GET(), PATCH(), customerError(), GET(), PATCH(), bulkUpdateOryCMSCustomers() (+14 more)

### Community 25 - "mailer.ts"
Cohesion: 0.15
Nodes (22): POST(), POST(), GET(), canSend(), disableOptionalEmails(), emailBaseUrl(), ensureEmailSchema(), OPTIONAL_EMAIL_TYPES (+14 more)

### Community 26 - "categories.ts"
Cohesion: 0.13
Nodes (29): GET(), categoryError(), DELETE(), GET(), PATCH(), categoryError(), DELETE(), GET() (+21 more)

### Community 27 - "media.ts"
Cohesion: 0.18
Nodes (20): GET(), POST(), toOryCMSMediaError(), allowedTypes, cleanMediaName(), CloudinaryUploadResponse, deleteCloudinaryAsset(), deleteOryCMSMedia() (+12 more)

### Community 28 - "dashboard-data.ts"
Cohesion: 0.10
Nodes (39): POST(), assignAwb(), cancelPickup(), cancelShiprocketOrder(), cancelShiprocketShipment(), createShiprocketOrder(), requestPickup(), reschedulePickup() (+31 more)

### Community 29 - "database-admin.tsx"
Cohesion: 0.14
Nodes (12): Badge(), compactNumber(), DatabaseHealth, DatabaseLog, DatabaseTable, dateTime(), Health, healthColor() (+4 more)

### Community 30 - "page.tsx"
Cohesion: 0.11
Nodes (15): CheckoutPage(), COUPONS, formatAddress(), INDIA_STATES, inputCls(), loadRazorpaySdk(), normalizeAddress(), openRazorpayCheckout() (+7 more)

### Community 31 - "page.tsx"
Cohesion: 0.13
Nodes (19): CATEGORIES, CATEGORY_SEARCH_TERMS, CmsProduct, cmsProductToStoreProduct(), comparePrice(), PRICE_RANGES, productHref(), ProductsPageContent() (+11 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "categories-admin.tsx"
Cohesion: 0.07
Nodes (12): OryCMSAdminPage(), ALLOWED_EXTENSIONS, ALLOWED_TYPES, Category, CategoryImage, CategoryStatus, emptyCategory, formatDateTime() (+4 more)

### Community 34 - "profile-admin.tsx"
Cohesion: 0.11
Nodes (12): Toast, AdminProfile, ALLOWED_EXTENSIONS, dateTime(), initials(), label(), MediaAsset, OryCMSAdminProfilePage() (+4 more)

### Community 35 - "devDependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+11 more)

### Community 36 - "inventory-admin.tsx"
Cohesion: 0.16
Nodes (14): Card(), csvCell(), dateTime(), download(), downloadCsv(), downloadExcel(), downloadPdf(), escapeHtml() (+6 more)

### Community 37 - "page.tsx"
Cohesion: 0.13
Nodes (15): CATEGORIES, comparePrice(), formatINR(), getHomeProducts(), Home(), SUSTAINABILITY, TUTORIALS, STORIES (+7 more)

### Community 38 - "analytics-admin.tsx"
Cohesion: 0.14
Nodes (13): Analytics, arr(), dateTime(), healthTitle(), InsightRows(), Metric(), money(), num() (+5 more)

### Community 39 - "OryCMSContentTable.tsx"
Cohesion: 0.13
Nodes (14): Mode, OryCMSCollectionContentPageProps, FieldErrors, initFormData(), OryCMSContentForm(), OryCMSContentFormProps, formatCell(), getPrimaryField() (+6 more)

### Community 40 - "order-notification-emails.ts"
Cohesion: 0.22
Nodes (17): DELETE(), PATCH(), GET(), notificationEmailError(), POST(), CreateInput, createOrderNotificationEmail(), deleteOrderNotificationEmail() (+9 more)

### Community 41 - "media-library.tsx"
Cohesion: 0.13
Nodes (12): ALLOWED_EXTENSIONS, ALLOWED_TYPES, formatBytes(), MediaAsset, MediaCard(), MediaPreview(), OryCMSMediaLibrary(), PendingUpload (+4 more)

### Community 42 - "requireOryCMSUser"
Cohesion: 0.12
Nodes (23): GET(), GET(), GET(), DELETE(), POST(), shipmentError(), cancelError(), POST() (+15 more)

### Community 43 - "orders-admin.tsx"
Cohesion: 0.11
Nodes (21): ActivityLog, ActivityPanel(), dateTime(), formatAddress(), FulfillmentActionBar(), FulfillmentSteps(), Info(), label() (+13 more)

### Community 44 - "jsonError"
Cohesion: 0.13
Nodes (20): DELETE(), PATCH(), responseError(), GET(), POST(), responseError(), EMPTY, OryCMSCertificatesAdmin() (+12 more)

### Community 45 - "requireCsrf"
Cohesion: 0.16
Nodes (27): POST(), POST(), POST(), POST(), POST(), POST(), GET(), PATCH() (+19 more)

### Community 46 - "legal-page.tsx"
Cohesion: 0.11
Nodes (13): metadata, SECTIONS, metadata, SECTIONS, metadata, SECTIONS, metadata, SECTIONS (+5 more)

### Community 47 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 48 - "allowScripts"
Cohesion: 0.12
Nodes (17): allowScripts, esbuild, @esbuild/darwin-arm64, @esbuild/darwin-x64, @esbuild/linux-arm64, @esbuild/linux-x64, fsevents@2.3.3, @img/sharp-darwin-arm64 (+9 more)

### Community 49 - "inventory.ts"
Cohesion: 0.14
Nodes (25): DELETE(), GET(), PATCH(), productError(), GET(), deleteOryCMSProduct(), ensureOryCMSProductsSchema(), getOryCMSProduct() (+17 more)

### Community 50 - "product-detail-view.tsx"
Cohesion: 0.15
Nodes (16): buildSubtitle(), ProductCard(), ProductCardProps, comparePrice(), contentLines(), isHtml(), ProductDetail, ProductDetailView() (+8 more)

### Community 51 - "page.tsx"
Cohesion: 0.13
Nodes (14): canCancel(), canRetry(), fmt(), loadRazorpaySdk(), openRazorpayCheckout(), Order, OrderDetailsPage(), OrderItem (+6 more)

### Community 52 - "orders.ts"
Cohesion: 0.19
Nodes (19): GET(), GET(), GET(), orderError(), POST(), getOryCMSOrder(), isUuid(), buildResult() (+11 more)

### Community 53 - "collection-schema-form.ts"
Cohesion: 0.21
Nodes (11): collectionDefinitionToForm(), CollectionFieldFormState, collectionFieldFormToSchema(), CollectionSchemaFormState, collectionSchemaFormToDefinition(), createEmptyCollectionField(), createEmptyCollectionSchemaForm(), ORYCMS_FIELD_TYPES (+3 more)

### Community 54 - "carousel.tsx"
Cohesion: 0.05
Nodes (34): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+26 more)

### Community 55 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, check:node, clean, dev, lint, prebuild, predev (+5 more)

### Community 56 - "settings-admin.tsx"
Cohesion: 0.12
Nodes (10): Card(), EMPTY_SHIPROCKET_FORM, Field(), NotificationEmail, NotificationToggles, OrderNotificationEmailsCard(), OryCMSSettingsPage(), ShiprocketConfig (+2 more)

### Community 57 - "tokens.repo.ts"
Cohesion: 0.30
Nodes (7): consumeOryCMSToken(), createOryCMSToken(), DEFAULT_TTL_MS, hashToken(), OryCMSConsumedToken, OryCMSCreateTokenInput, OryCMSTokenType

### Community 58 - "OryCMSDashboard"
Cohesion: 0.36
Nodes (9): firstString(), normalizeDate(), POST(), safeEqual(), ShiprocketWebhookBody, enqueueJob(), getShipmentByAwb(), getShipmentByShiprocketId() (+1 more)

### Community 59 - "page.tsx"
Cohesion: 0.33
Nodes (8): button(), detailsTable(), EmailTemplateName, emailTemplates, escapeHtml(), layout(), shipmentEmail(), TemplateInput

### Community 60 - "form.tsx"
Cohesion: 0.14
Nodes (31): POST(), issueRefund(), linkOrder(), OrderLink, paise(), rzpDate(), syncOrderRefundStatus(), syncPaymentsFromRazorpay() (+23 more)

### Community 61 - "route-guards.test.ts"
Cohesion: 0.29
Nodes (8): guardOryCMS(), hasStatusCode(), oryJsonError(), oryJsonOk(), StatusfulError, toErrorResponse(), makePool(), poolFor()

### Community 62 - "token-links.ts"
Cohesion: 0.31
Nodes (7): BODY, buildOryCMSTokenLink(), dispatchOryCMSTokenLink(), oryAppOrigin(), OryCMSTokenDispatchResult, SUBJECTS, TOKEN_PATHS

### Community 63 - "chart.tsx"
Cohesion: 0.14
Nodes (24): GET(), GET(), GET(), GET(), GET(), POST(), POST(), GET() (+16 more)

### Community 64 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 65 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 66 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 67 - "frontend-auth-page.tsx"
Cohesion: 0.26
Nodes (15): GET(), asArray(), ensureInventoryEventsSchema(), getOryCMSInventoryData(), InventoryEventRow, iso(), label(), lookup() (+7 more)

### Community 68 - "content-ui.test.ts"
Cohesion: 0.25
Nodes (4): BLOG_COLLECTION, EMPTY_COLLECTION, getColumns(), getPrimaryField()

### Community 69 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 70 - "sheet.tsx"
Cohesion: 0.21
Nodes (14): GET(), isAuthorized(), POST(), run(), safeEqual(), runDueJobs(), runJob(), RunSummary (+6 more)

### Community 71 - "table.tsx"
Cohesion: 0.12
Nodes (11): Analytics, buildWarnings(), Cards, Chart(), OryCMSPaymentsAdmin(), Payment, Series, Settlement (+3 more)

### Community 72 - "default-memoji-avatar.tsx"
Cohesion: 0.28
Nodes (8): BACKGROUNDS, DefaultMemojiAvatar(), DefaultMemojiAvatarProps, HAIRS, hashSeed(), pick(), SHIRTS, SKINS

### Community 74 - "OryCMSCollectionSchemaEditor.tsx"
Cohesion: 0.29
Nodes (5): ApiResponse, fieldTypeLabels, moveItem(), OryCMSCollectionSchemaEditor(), OryCMSCollectionSchemaEditorProps

### Community 75 - "breadcrumb.tsx"
Cohesion: 0.15
Nodes (23): GET(), parseInput(), PUT(), settingsError(), resetShiprocketToken(), decryptSecret(), encryptionKey(), encryptSecret() (+15 more)

### Community 76 - "drawer.tsx"
Cohesion: 0.35
Nodes (9): POST(), POST(), POST(), requireOryCMSRole(), PaymentAuditAction, PaymentAuditRow, recordPaymentAudit(), getCapturedPaymentForRefund() (+1 more)

### Community 77 - "navigation-menu.tsx"
Cohesion: 0.17
Nodes (7): Card(), OrdersTable(), QueueBoard(), rows, ServicePanel(), stages, StatusPill()

### Community 78 - "select.tsx"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 79 - "admin-content-routes.ts"
Cohesion: 0.39
Nodes (6): adminContentCreatePath(), adminContentEditPath(), adminContentListPath(), legacyCollectionContentCreatePath(), legacyCollectionContentEditPath(), legacyCollectionContentListPath()

### Community 80 - "validateEmail"
Cohesion: 0.08
Nodes (32): cache, CacheEntry, GET(), AuthProvider(), ApiContext, AssignAwbResponse, CancelResponse, checkServiceability() (+24 more)

### Community 81 - "page.tsx"
Cohesion: 0.20
Nodes (8): Badge(), Detail, extractTimeline(), Info(), OryCMSPaymentDetail(), RefundModal(), Toast, ToastStack()

### Community 82 - "PageHeader.tsx"
Cohesion: 0.33
Nodes (4): PageAction, PageHeader(), PageHeaderProps, PlaceholderPageProps

### Community 83 - "card.tsx"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 84 - "route.ts"
Cohesion: 0.53
Nodes (5): DELETE(), errResponse(), GET(), PATCH(), RouteCtx

### Community 86 - "AppSidebar.tsx"
Cohesion: 0.32
Nodes (10): comparePrice(), discountLabel(), formatINR(), inr, loadProduct(), mapOryCMSProductToDetail(), ProductPage(), ensureProductImages() (+2 more)

### Community 87 - "react"
Cohesion: 0.35
Nodes (10): GET(), cell(), COLUMNS, escapePdf(), ExportRow, makeSimplePdf(), toCsv(), toPdf() (+2 more)

### Community 88 - "package.json"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 89 - "Adhunik Crop Care Private Limited"
Cohesion: 0.33
Nodes (5): Adhunik Crop Care Private Limited, Commands, Import Rules, Project Structure, Requirements

### Community 91 - "route.ts"
Cohesion: 0.60
Nodes (4): DELETE(), handleError(), POST(), RouteCtx

### Community 93 - "route.ts"
Cohesion: 0.60
Nodes (4): errResponse(), GET(), POST(), RouteCtx

### Community 96 - "OryCMSMediaLibrary.tsx"
Cohesion: 0.50
Nodes (3): formatBytes(), ListResult, OryCMSMediaLibrary()

### Community 97 - "alert.tsx"
Cohesion: 0.17
Nodes (14): ALL_FIELDS, ContactApiResponse, ContactEnquiryForm(), INITIAL_VALUES, inputClass(), phoneContainerClass(), SubmissionState, CONTACT_TOPICS (+6 more)

### Community 98 - "input-otp.tsx"
Cohesion: 0.22
Nodes (3): AuthFlow(), Mode, safePath()

### Community 99 - "oryntic-error-reporting.ts"
Cohesion: 0.40
Nodes (3): OrynticErrorOptions, OrynticEvents, Window

### Community 100 - "utils.ts"
Cohesion: 0.50
Nodes (3): formatCompactCurrency(), formatCurrency(), inrFormatter

### Community 102 - "prisma-migrate-deploy.mjs"
Cohesion: 0.40
Nodes (3): deployment, prismaCli, require

### Community 104 - "testimonials-carousel.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 110 - "route.ts"
Cohesion: 0.83
Nodes (3): errResponse(), GET(), POST()

### Community 111 - "route.ts"
Cohesion: 0.83
Nodes (3): errResponse(), GET(), POST()

### Community 114 - "accordion.tsx"
Cohesion: 0.27
Nodes (9): POST(), consumeAuthToken(), createUser(), normalizePhone(), setPassword(), validateEmail(), validatePassword(), money() (+1 more)

### Community 115 - "tabs.tsx"
Cohesion: 0.24
Nodes (13): GET(), notifError(), PUT(), DEFAULTS, getShipmentNotificationSettings(), isNotificationTypeEnabled(), ShipmentNotificationSettings, ShipmentNotificationType (+5 more)

### Community 135 - "bcryptjs"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 137 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 183 - "page.tsx"
Cohesion: 0.28
Nodes (7): CertificationsPage(), formatDate(), getCertificates(), metadata, PRINCIPLES, PROCESS, STANDARDS

### Community 184 - "route.ts"
Cohesion: 0.47
Nodes (5): bad(), BulkAction, ENQUEUE_ACTIONS, POST(), printManifest()

### Community 185 - "route.ts"
Cohesion: 0.39
Nodes (6): GET(), GET(), CONTENT_TYPES, isDocumentKind(), proxyDocument(), DocumentKind

### Community 186 - "input-otp.tsx"
Cohesion: 0.29
Nodes (6): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle

### Community 187 - "testimonials-carousel.tsx"
Cohesion: 0.50
Nodes (4): buildTransform(), ITEMS, Slot, TestimonialsCarousel()

### Community 206 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 207 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 209 - "route.ts"
Cohesion: 0.33
Nodes (5): AppSidebar(), ChildItem, Item, NAV, NavPermission

### Community 210 - "@base-ui/react"
Cohesion: 0.18
Nodes (11): @base-ui/react, dependencies, @base-ui/react, pg, @sentry/nextjs, shadcn, tw-animate-css, pg (+3 more)

### Community 221 - "pg"
Cohesion: 0.50
Nodes (3): ToggleGroup, ToggleGroupContext, ToggleGroupItem

## Knowledge Gaps
- **728 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+723 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **61 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `utils.ts`, `database-health.ts`, `bcryptjs`, `dashboard.tsx`, `formatCurrency`, `breadcrumb.tsx`, `users-admin.tsx`, `products-admin.tsx`, `customers-admin.tsx`, `sidebar.tsx`, `database-admin.tsx`, `categories-admin.tsx`, `profile-admin.tsx`, `inventory-admin.tsx`, `analytics-admin.tsx`, `OryCMSContentTable.tsx`, `media-library.tsx`, `orders-admin.tsx`, `menubar.tsx`, `carousel.tsx`, `settings-admin.tsx`, `input-otp.tsx`, `command.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `table.tsx`, `navigation-menu.tsx`, `accordion.tsx`, `select.tsx`, `tabs.tsx`, `route.ts`, `PageHeader.tsx`, `card.tsx`, `page.tsx`, `pg`, `testimonials-carousel.tsx`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `index.ts`, `@base-ui/react`, `cn`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `dependencies` connect `@base-ui/react` to `dependencies`, `carousel.tsx`, `class-variance-authority`, `clsx`, `dotenv`, `init`, `lucide-react`, `package.json`, `next-auth`, `nodemailer`, `@ory-cms/core`, `@ory-cms/next`, `@neondatabase/serverless`, `@prisma/adapter-pg`, `@prisma/client`, `react-dom`, `sanitize-html`, `shadcn`, `sharp`, `tailwind-merge`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-table`, `@tiptap/extension-table-header`, `@tiptap/extension-table-row`, `@tiptap/extension-text-align`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, `tw-animate-css`, `@types/nodemailer`, `@types/sanitize-html`, `@tiptap/extension-table-cell`, `@tiptap/extension-underline`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _728 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06202950918398073 - nodes in this community are weakly interconnected._
- **Should `users.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05864197530864197 - nodes in this community are weakly interconnected._
- **Should `cart-drawer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05310734463276836 - nodes in this community are weakly interconnected._