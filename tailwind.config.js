/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				amber: {
					50: 'rgb(var(--theme-50-rgb, 255 251 235) / <alpha-value>)',
					100: 'rgb(var(--theme-100-rgb, 254 243 199) / <alpha-value>)',
					200: 'rgb(var(--theme-200-rgb, 253 230 138) / <alpha-value>)',
					300: 'rgb(var(--theme-300-rgb, 252 211 77) / <alpha-value>)',
					400: 'rgb(var(--theme-400-rgb, 251 191 36) / <alpha-value>)',
					500: 'rgb(var(--theme-500-rgb, 245 158 11) / <alpha-value>)',
					600: 'rgb(var(--theme-600-rgb, 217 119 6) / <alpha-value>)',
					700: 'rgb(var(--theme-700-rgb, 180 83 9) / <alpha-value>)',
					800: 'rgb(var(--theme-800-rgb, 146 64 14) / <alpha-value>)',
					900: 'rgb(var(--theme-900-rgb, 120 53 15) / <alpha-value>)',
					950: 'rgb(var(--theme-950-rgb, 69 26 3) / <alpha-value>)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};