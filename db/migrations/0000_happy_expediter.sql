CREATE TABLE `Balance` (
	`ID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monto_esperado` real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `Categoria` (
	`ID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`monto_esperado` real DEFAULT 0,
	`monto_real` real DEFAULT 0,
	`porcentaje` real DEFAULT 0,
	`descripcion` text,
	`usuario_id` integer,
	`clave` text
);
--> statement-breakpoint
CREATE TABLE `Meta` (
	`ID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`meta_total` real NOT NULL,
	`monto` real DEFAULT 0,
	`porcentaje_actual` real DEFAULT 0,
	`descripcion` text,
	`fecha_finalizar` text,
	`usuario_id` integer
);
--> statement-breakpoint
CREATE TABLE `meta_aporte` (
	`ID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meta_id` integer NOT NULL,
	`monto` real NOT NULL,
	`fecha_hora` text DEFAULT CURRENT_TIMESTAMP,
	`descripcion` text,
	`transaccion_id` integer,
	FOREIGN KEY (`meta_id`) REFERENCES `Meta`(`ID`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaccion_id`) REFERENCES `transaccion`(`ID`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `Producto_financiero` (
	`ID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text,
	`monto_neto` real,
	`monto_total` real,
	`interes` real,
	`entidad_financiera` text,
	`tipo` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`meta_id` integer,
	`usuario_id` integer,
	FOREIGN KEY (`meta_id`) REFERENCES `Meta`(`ID`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Producto_financiero_meta_id_unique` ON `Producto_financiero` (`meta_id`);--> statement-breakpoint
CREATE TABLE `transaccion` (
	`ID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text,
	`valor_transaccion` real NOT NULL,
	`fecha_hora` text DEFAULT CURRENT_TIMESTAMP,
	`categoria_id` integer,
	`meta_id` integer,
	`tipo` text,
	`producto_financiero_id` integer,
	`descripcion` text,
	`usuario_id` integer,
	FOREIGN KEY (`categoria_id`) REFERENCES `Categoria`(`ID`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meta_id`) REFERENCES `Meta`(`ID`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_financiero_id`) REFERENCES `Producto_financiero`(`ID`) ON UPDATE no action ON DELETE no action
);
