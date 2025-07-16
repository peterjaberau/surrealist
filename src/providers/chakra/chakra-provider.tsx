import { ChakraProvider as Provider, defineConfig, defaultConfig, createSystem } from "@chakra-ui/react"

const themeConfig: any = defineConfig({
	...defaultConfig,
	cssVarsPrefix: "ck",
	preflight: false
} as any)
const theme = createSystem(themeConfig)

export const ChakraProvider = (props: { children: React.ReactNode }) => {
	return <Provider value={theme}>{props.children}</Provider>
}
