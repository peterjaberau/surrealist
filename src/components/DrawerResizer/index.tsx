import { useSlotRecipe } from "@chakra-ui/react"
import { drawerResizerRecipe } from "./recipe"
import { Box } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { clamp } from "~/util/helpers"

export interface DrawerResizerProps {
	minSize: number
	maxSize: number
	onResize: (width: number) => void
}

export function DrawerResizer({ minSize, maxSize, onResize }: DrawerResizerProps) {
	const [isResizing, setIsResizing] = useState(false)
	const resizer = useRef<HTMLDivElement>(null)

	const recipe = useSlotRecipe({ recipe: drawerResizerRecipe })
	const styles = recipe(recipe)

	useEffect(() => {
		const onMouseMove = (event: MouseEvent) => {
			if (resizer.current) {
				event.preventDefault()
				onResize(clamp(window.innerWidth - event.clientX, minSize, maxSize))
			}
		}

		const onMouseUp = () => {
			window.removeEventListener("mousemove", onMouseMove)
			window.removeEventListener("mouseup", onMouseUp)

			setIsResizing(false)
			document.body.style.cursor = ""
		}

		resizer.current?.addEventListener("mousedown", (event) => {
			event.preventDefault()

			window.addEventListener("mousemove", onMouseMove)
			window.addEventListener("mouseup", onMouseUp)

			setIsResizing(true)
			document.body.style.cursor = "ew-resize"
		})

		return () => {
			window.removeEventListener("mousemove", onMouseMove)
			window.removeEventListener("mouseup", onMouseUp)
		}
	}, [minSize, maxSize, onResize])

	return (
		<Box ref={resizer} css={styles.root}>
			<Box css={styles.resizer} />
		</Box>
	)
}
