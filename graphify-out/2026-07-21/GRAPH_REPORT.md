# Graph Report - adhunikcropcare  (2026-07-21)

## Corpus Check
- 369 files · ~830,027 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2149 nodes · 3822 edges · 206 communities (173 shown, 33 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d5128bd`
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
- next
- next-auth
- collection-schema-form.test.ts
- pg
- react-dom
- shadcn
- tailwind-merge
- tw-animate-css
- postcss.config.mjs
- check-node-version.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 157 edges
2. `requireOryCMSUser()` - 65 edges
3. `ensureStorefrontAuthSchema()` - 38 edges
4. `jsonError()` - 35 edges
5. `formatCurrency()` - 32 edges
6. `requireCsrf()` - 30 edges
7. `useAuth()` - 22 edges
8. `CartDrawer()` - 22 edges
9. `OryCMSDashboard()` - 21 edges
10. `getOryCMSAnalyticsInsights()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `AppSidebar()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/AppSidebar.tsx → src/lib/utils.ts
- `Card()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts
- `Delta()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts
- `Segmented()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts
- `StatusPill()` --calls--> `cn()`  [EXTRACTED]
  orycms/components/dashboard/Dashboard.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (206 total, 33 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.06
Nodes (59): clearOryCMSHooks(), defineOryCMSHook(), getOryCMSHooks(), HookOptions, registerOryCMSHook(), unregisterOryCMSHook(), HOOK_EVENTS, buildOryCMSHookContext() (+51 more)

### Community 1 - "users.ts"
Cohesion: 0.09
Nodes (54): hashToken(), POST(), GET(), GET(), PATCH(), profileError(), DELETE(), GET() (+46 more)

### Community 2 - "cart-drawer.tsx"
Cohesion: 0.06
Nodes (32): nextConfig, .next, metadata, MILESTONES, PROMISES, VALUES, metadata, CULTURES (+24 more)

### Community 3 - "utils.ts"
Cohesion: 0.04
Nodes (28): Avatar, AvatarFallback, AvatarImage, Button, ButtonProps, buttonVariants, Checkbox, HoverCardContent (+20 more)

### Community 4 - "storefront-orders.ts"
Cohesion: 0.12
Nodes (39): POST(), POST(), aggregateItems(), cancelOrder(), CheckoutItem, CheckoutOrderResponse, CheckoutPayload, createCheckoutOrder() (+31 more)

### Community 5 - "cn"
Cohesion: 0.07
Nodes (30): Badge(), BadgeProps, badgeVariants, Calendar(), CalendarDayButton(), DialogContent, DialogDescription, DialogFooter() (+22 more)

### Community 6 - "database-health.ts"
Cohesion: 0.07
Nodes (31): config, isSafeFromPath(), isStorefrontProtectedPath(), middleware(), PUBLIC_ORYCMS_AUTH_API, PUBLIC_ORYCMS_PAGES, orycmsConfig, AdminPlaceholderPage() (+23 more)

### Community 7 - "storefront-auth.ts"
Cohesion: 0.11
Nodes (31): GET(), POST(), GET(), POST(), assertAuthSecret(), base64url(), clearAuthCookies(), consumeAuthToken() (+23 more)

### Community 8 - "dashboard.tsx"
Cohesion: 0.06
Nodes (31): AlertsAndCustomers(), DashboardShell(), dateTime(), findActiveSidebarGroup(), greeting(), ICONS, Insight(), InsightsPanel() (+23 more)

### Community 9 - "formatCurrency"
Cohesion: 0.07
Nodes (25): Card(), CustomerInsights(), Delta(), ExecMetrics(), funnel, orders, OrdersOverview(), OrdersTable() (+17 more)

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
Cohesion: 0.13
Nodes (29): DELETE(), GET(), PATCH(), productError(), DELETE(), GET(), POST(), productError() (+21 more)

### Community 16 - "dependencies"
Cohesion: 0.06
Nodes (31): @base-ui/react, class-variance-authority, clsx, dotenv, init, lucide-react, @neondatabase/serverless, nodemailer (+23 more)

### Community 17 - "products-admin.tsx"
Cohesion: 0.08
Nodes (15): ALLOWED_EXTENSIONS, ALLOWED_TYPES, emptyProduct, formatBytes(), formatDateTime(), MediaPickerDialog(), Meta, OryCMSProductForm() (+7 more)

### Community 18 - "customers-admin.tsx"
Cohesion: 0.09
Nodes (19): Avatar(), BulkButton(), ConfirmModal(), ConfirmState, Customer, CustomerDetails, CustomerStatus, dateTime() (+11 more)

### Community 19 - "useAuth"
Cohesion: 0.11
Nodes (19): metadata, AppProviders(), AuthModal(), ForgotPasswordForm(), inputCls(), ResetPasswordForm(), SignInForm(), SignUpForm() (+11 more)

### Community 20 - "sidebar.tsx"
Cohesion: 0.07
Nodes (26): Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+18 more)

### Community 21 - "header.tsx"
Cohesion: 0.13
Nodes (21): FIXED_NAV_LINKS, Header(), StorefrontCategory, CartContext, CartContextValue, CartItem, CartProductInput, CartProvider() (+13 more)

### Community 22 - "page.tsx"
Cohesion: 0.13
Nodes (23): AccountPage(), Address, AddressesView(), comparePrice(), EditProfileView(), fmt(), fmtDate(), formatAddress() (+15 more)

### Community 23 - "analytics-insights.ts"
Cohesion: 0.15
Nodes (23): GET(), aggregateCategories(), aggregateProducts(), between(), buildRecommendations(), byQuantity(), byRevenue(), CustomerRow (+15 more)

### Community 24 - "customers.ts"
Cohesion: 0.19
Nodes (22): customerError(), DELETE(), GET(), PATCH(), customerError(), GET(), PATCH(), bulkUpdateOryCMSCustomers() (+14 more)

### Community 25 - "mailer.ts"
Cohesion: 0.16
Nodes (21): POST(), GET(), canSend(), disableOptionalEmails(), emailBaseUrl(), ensureEmailSchema(), isEmailDeliveryConfigured(), OPTIONAL_EMAIL_TYPES (+13 more)

### Community 26 - "categories.ts"
Cohesion: 0.17
Nodes (21): GET(), categoryError(), DELETE(), GET(), PATCH(), CATEGORY_STATUSES, CategoryImageInput, CategoryStatus (+13 more)

### Community 27 - "media.ts"
Cohesion: 0.16
Nodes (21): DELETE(), GET(), POST(), toOryCMSMediaError(), allowedTypes, cleanMediaName(), CloudinaryUploadResponse, deleteCloudinaryAsset() (+13 more)

### Community 28 - "dashboard-data.ts"
Cohesion: 0.14
Nodes (22): asRecord(), countVisitors(), CustomerRow, getOryCMSDashboardData(), groupRevenueByLabel(), iso(), isRevenueOrder(), labelsFor() (+14 more)

### Community 29 - "database-admin.tsx"
Cohesion: 0.12
Nodes (14): OryCMSBreadcrumbItem, OryCMSBreadcrumbs(), Badge(), compactNumber(), DatabaseHealth, DatabaseLog, DatabaseTable, dateTime() (+6 more)

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
Cohesion: 0.10
Nodes (9): ALLOWED_EXTENSIONS, ALLOWED_TYPES, Category, CategoryImage, CategoryStatus, emptyCategory, formatDateTime(), OryCMSCategoriesList() (+1 more)

### Community 34 - "profile-admin.tsx"
Cohesion: 0.12
Nodes (11): AdminProfile, ALLOWED_EXTENSIONS, dateTime(), initials(), label(), MediaAsset, OryCMSAdminProfilePage(), Toast (+3 more)

### Community 35 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+13 more)

### Community 36 - "inventory-admin.tsx"
Cohesion: 0.16
Nodes (14): Card(), csvCell(), dateTime(), download(), downloadCsv(), downloadExcel(), downloadPdf(), escapeHtml() (+6 more)

### Community 37 - "page.tsx"
Cohesion: 0.14
Nodes (16): CATEGORIES, comparePrice(), formatINR(), getHomeProducts(), Home(), SUSTAINABILITY, TUTORIALS, STORIES (+8 more)

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
Cohesion: 0.22
Nodes (14): categoryError(), DELETE(), GET(), POST(), GET(), GET(), passwordError(), PATCH() (+6 more)

### Community 43 - "orders-admin.tsx"
Cohesion: 0.19
Nodes (12): dateTime(), formatAddress(), Info(), label(), Order, OrderItem, OryCMSOrderDetails(), OryCMSOrdersList() (+4 more)

### Community 44 - "jsonError"
Cohesion: 0.24
Nodes (11): POST(), GET(), GET(), GET(), PATCH(), POST(), globalForPrisma, jsonError() (+3 more)

### Community 45 - "requireCsrf"
Cohesion: 0.33
Nodes (12): POST(), POST(), POST(), POST(), POST(), POST(), authenticateUser(), findUserByEmail() (+4 more)

### Community 46 - "legal-page.tsx"
Cohesion: 0.14
Nodes (11): metadata, SECTIONS, metadata, SECTIONS, metadata, SECTIONS, LegalPage(), LegalPageProps (+3 more)

### Community 47 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 48 - "allowScripts"
Cohesion: 0.12
Nodes (17): allowScripts, esbuild, @esbuild/darwin-arm64, @esbuild/darwin-x64, @esbuild/linux-arm64, @esbuild/linux-x64, fsevents@2.3.3, @img/sharp-darwin-arm64 (+9 more)

### Community 49 - "inventory.ts"
Cohesion: 0.26
Nodes (15): GET(), asArray(), ensureInventoryEventsSchema(), getOryCMSInventoryData(), InventoryEventRow, iso(), label(), lookup() (+7 more)

### Community 50 - "product-detail-view.tsx"
Cohesion: 0.18
Nodes (14): buildSubtitle(), ProductCard(), ProductCardProps, comparePrice(), contentLines(), isHtml(), ProductDetailView(), productHref() (+6 more)

### Community 51 - "page.tsx"
Cohesion: 0.16
Nodes (11): canCancel(), canRetry(), fmt(), loadRazorpaySdk(), openRazorpayCheckout(), Order, OrderDetailsPage(), OrderItem (+3 more)

### Community 52 - "orders.ts"
Cohesion: 0.24
Nodes (12): GET(), orderError(), GET(), ordersError(), asRecord(), getOryCMSOrder(), isUuid(), listOryCMSOrders() (+4 more)

### Community 53 - "collection-schema-form.ts"
Cohesion: 0.21
Nodes (11): collectionDefinitionToForm(), CollectionFieldFormState, collectionFieldFormToSchema(), CollectionSchemaFormState, collectionSchemaFormToDefinition(), createEmptyCollectionField(), createEmptyCollectionSchemaForm(), ORYCMS_FIELD_TYPES (+3 more)

### Community 54 - "carousel.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 55 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, check:node, clean, dev, lint, prebuild, predev (+5 more)

### Community 56 - "settings-admin.tsx"
Cohesion: 0.17
Nodes (7): Card(), Field(), NotificationEmail, OrderNotificationEmailsCard(), OryCMSSettingsPage(), ToastStack(), Toggle()

### Community 57 - "tokens.repo.ts"
Cohesion: 0.30
Nodes (7): consumeOryCMSToken(), createOryCMSToken(), DEFAULT_TTL_MS, hashToken(), OryCMSConsumedToken, OryCMSCreateTokenInput, OryCMSTokenType

### Community 58 - "OryCMSDashboard"
Cohesion: 0.20
Nodes (3): OryCMSAdminPage(), OryCMSCategoryForm(), OryCMSDashboard()

### Community 59 - "page.tsx"
Cohesion: 0.27
Nodes (10): comparePrice(), discountLabel(), formatINR(), inr, loadProduct(), mapOryCMSProductToDetail(), ProductPage(), ProductDetail (+2 more)

### Community 60 - "form.tsx"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 61 - "route-guards.test.ts"
Cohesion: 0.29
Nodes (8): guardOryCMS(), hasStatusCode(), oryJsonError(), oryJsonOk(), StatusfulError, toErrorResponse(), makePool(), poolFor()

### Community 62 - "token-links.ts"
Cohesion: 0.31
Nodes (7): BODY, buildOryCMSTokenLink(), dispatchOryCMSTokenLink(), oryAppOrigin(), OryCMSTokenDispatchResult, SUBJECTS, TOKEN_PATHS

### Community 63 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

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
Cohesion: 0.22
Nodes (3): AuthFlow(), Mode, safePath()

### Community 68 - "content-ui.test.ts"
Cohesion: 0.25
Nodes (4): BLOG_COLLECTION, EMPTY_COLLECTION, getColumns(), getPrimaryField()

### Community 69 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 70 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 71 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 72 - "default-memoji-avatar.tsx"
Cohesion: 0.28
Nodes (8): BACKGROUNDS, DefaultMemojiAvatar(), DefaultMemojiAvatarProps, HAIRS, hashSeed(), pick(), SHIRTS, SKINS

### Community 73 - "templates.ts"
Cohesion: 0.31
Nodes (7): button(), detailsTable(), EmailTemplateName, emailTemplates, escapeHtml(), layout(), TemplateInput

### Community 74 - "OryCMSCollectionSchemaEditor.tsx"
Cohesion: 0.29
Nodes (5): ApiResponse, fieldTypeLabels, moveItem(), OryCMSCollectionSchemaEditor(), OryCMSCollectionSchemaEditorProps

### Community 75 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 76 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 77 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 78 - "select.tsx"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 79 - "admin-content-routes.ts"
Cohesion: 0.39
Nodes (6): adminContentCreatePath(), adminContentEditPath(), adminContentListPath(), legacyCollectionContentCreatePath(), legacyCollectionContentEditPath(), legacyCollectionContentListPath()

### Community 80 - "validateEmail"
Cohesion: 0.32
Nodes (7): POST(), createUser(), normalizePhone(), validateEmail(), verifySignupOtp(), money(), normalizeCheckoutPayload()

### Community 81 - "page.tsx"
Cohesion: 0.36
Nodes (7): formatCurrency(), formatOrderId(), loadOrder(), OrderItem, PAYMENT_LABELS, ThankYouOrder, ThankYouPage()

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
Cohesion: 0.33
Nodes (5): AppSidebar(), ChildItem, Item, NAV, NavPermission

### Community 87 - "react"
Cohesion: 0.33
Nodes (6): useCarousel(), useChart(), useFormField(), useSidebar(), react, react

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
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 98 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

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
Nodes (4): buildTransform(), ITEMS, Slot, TestimonialsCarousel()

### Community 110 - "route.ts"
Cohesion: 0.83
Nodes (3): errResponse(), GET(), POST()

### Community 111 - "route.ts"
Cohesion: 0.83
Nodes (3): errResponse(), GET(), POST()

### Community 114 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 115 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

## Knowledge Gaps
- **636 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+631 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `utils.ts`, `dashboard.tsx`, `formatCurrency`, `users-admin.tsx`, `products-admin.tsx`, `customers-admin.tsx`, `sidebar.tsx`, `database-admin.tsx`, `categories-admin.tsx`, `profile-admin.tsx`, `inventory-admin.tsx`, `analytics-admin.tsx`, `OryCMSContentTable.tsx`, `media-library.tsx`, `orders-admin.tsx`, `menubar.tsx`, `carousel.tsx`, `settings-admin.tsx`, `form.tsx`, `chart.tsx`, `command.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `table.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `select.tsx`, `PageHeader.tsx`, `card.tsx`, `AppSidebar.tsx`, `alert.tsx`, `input-otp.tsx`, `accordion.tsx`, `tabs.tsx`?**
  _High betweenness centrality (0.322) - this node is a cross-community bridge._
- **Why does `Calendar()` connect `cn` to `page.tsx`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Why does `ProfileView()` connect `page.tsx` to `useAuth`, `cn`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _636 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06202950918398073 - nodes in this community are weakly interconnected._
- **Should `users.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08633879781420765 - nodes in this community are weakly interconnected._
- **Should `cart-drawer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06140350877192982 - nodes in this community are weakly interconnected._