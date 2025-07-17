import { useInputState } from "@mantine/hooks"
import { useEffect, useState } from "react"
import { RecordId } from "surrealdb"
import { DrawerResizer } from "~/components/DrawerResizer"
import { CodeInput } from "~/components/Inputs"
import type { HistoryHandle } from "~/hooks/history"
import { useSaveable } from "~/hooks/save"
import { useStable } from "~/hooks/stable"
import { useValueValidator } from "~/hooks/surrealql"
import { useIsLight } from "~/hooks/theme"
import { executeQuery } from "~/screens/surrealist/connection/connection"
import { formatValue, parseValue } from "~/util/surrealql"
import { useConfirmation } from "../Confirmation"
import { ContentTab } from "./tabs/content"
import { RelationsTab } from "./tabs/relations"
import {
	Center,
	Text,
	Drawer as ChakraDrawer,
	Tabs as ChakraTabs,
	Icon as ChakraIcon,
	Heading,
	Box,
	CloseButton,
	HStack,
	Portal,
	Stack,
	IconButton,
	Badge,
} from "@chakra-ui/react"
import {
	LuSearch as IconSearch,
	LuArrowLeft as IconArrowLeft,
	LuTrash as IconDelete,
	LuFileJson as IconJSON,
	LuRefreshCw as IconRefresh,
	LuFolderSync as IconTransfer,
} from "react-icons/lu"

const DEFAULT_RECORD: ActiveRecord = {
	isEdge: false,
	exists: false,
	initial: "",
	inputs: [],
	outputs: [],
}

interface ActiveRecord {
	isEdge: boolean
	exists: boolean
	initial: string
	inputs: RecordId[]
	outputs: RecordId[]
}

export interface InspectorDrawerProps {
	opened: boolean
	history: HistoryHandle<RecordId>
	onClose: () => void
	onRefresh: () => void
}

export function InspectorDrawer({ opened, history, onClose, onRefresh }: InspectorDrawerProps) {
	const [currentRecord, setCurrentRecord] = useState<ActiveRecord>(DEFAULT_RECORD)
	const [recordId, setRecordId] = useInputState("")
	const [recordBody, setRecordBody] = useState("")
	const [error, setError] = useState("")
	const [isValid, body] = useValueValidator(recordBody)

	const isLight = useIsLight()
	const inputColor = currentRecord.exists ? undefined : "var(--mantine-color-red-6)"

	const saveHandle = useSaveable({
		valid: isValid,
		track: {
			recordBody,
		},
		onRevert(original) {
			setRecordBody(original.recordBody)
			setError("")
		},
		onSave: async (original, isApply) => {
			const id = history.current

			const [{ success, result }] = await executeQuery(/* surql */ `UPDATE $id CONTENT $body`, {
				id,
				body,
			})

			if (!success) {
				setError(result.replace("There was a problem with the database: ", ""))
				return false
			}

			onRefresh()

			if (!isApply) {
				onClose()
			}
		},
	})

	const fetchRecord = useStable(async (id: RecordId) => {
		const contentQuery = /* surql */ `SELECT * FROM ONLY $id`
		const inputQuery = /* surql */ `SELECT VALUE <-? FROM ONLY $id`
		const outputsQuery = /* surql */ `SELECT VALUE ->? FROM ONLY $id`

		const [{ result: content }, { result: inputs }, { result: outputs }] = await executeQuery(
			`${contentQuery};${inputQuery};${outputsQuery}`,
			{ id },
		)

		const formatted = formatValue(content, false, true)

		setError("")
		setRecordId(formatValue(id))
		setCurrentRecord({
			isEdge: !!content?.in && !!content?.out,
			exists: !!content,
			initial: formatted,
			inputs,
			outputs,
		})

		if (content) {
			setRecordBody(formatted)
		}

		saveHandle.track()
	})

	const refreshRecord = useStable(() => {
		if (history.current) {
			fetchRecord(history.current)
		}
	})

	const gotoRecord = useStable(() => {
		const id = parseValue(recordId)

		if (id instanceof RecordId) {
			history.push(id)
		}
	})

	const deleteRecord = useConfirmation({
		message: "You are about to delete this record. This action cannot be undone.",
		confirmText: "Delete",
		onConfirm: async () => {
			await executeQuery(/* surql */ `DELETE ${formatValue(history.current)}`)

			history.clear()

			onRefresh()
			onClose()
		},
	})

	useEffect(() => {
		if (history.current) {
			fetchRecord(history.current)
		}
	}, [history.current])

	const [width, setWidth] = useState(650)

	return (
		<ChakraDrawer.Root
			modal={false}
			closeOnEscape={true}
			contained={false}
			open={opened}
			onOpenChange={(e) => !e && onClose()}
			placement="end"
			trapFocus={false}

			// opened={opened}
			// onClose={onClose}
			// position="right"
			// trapFocus={false}
			// size={width}
			// styles={{
			// 	body: {
			// 		height: "100%",
			// 		display: "flex",
			// 		flexDirection: "column",
			// 	},
			// }}
		>
			<Portal>
				{/*<ChakraDrawer.Backdrop />*/}
				<ChakraDrawer.Positioner>
					<ChakraDrawer.Content px={6} py={2} maxW={width} width={width}>
						<DrawerResizer minSize={500} maxSize={1500} onResize={setWidth} />
						<Stack h="100%">
							<HStack w={'full'}>
								<HStack flex={1}>
									<ChakraIcon size="md" >
										<IconSearch />
									</ChakraIcon>
									<Heading size="xl">Record inspector</Heading>
								</HStack>
								<HStack justify="flex-end" >
									<HStack align="center">
										{history.canPop && (
											<IconButton aria-label="Go back" onClick={history.pop}>
												<IconArrowLeft />
											</IconButton>
										)}

										<IconButton
											disabled={!currentRecord.exists}
											variant="ghost"
											aria-label="Delete record"
											onClick={deleteRecord}
										>
											<IconDelete />
										</IconButton>

										<IconButton onClick={refreshRecord} aria-label="Refetch record" variant="ghost">
											<IconRefresh />
										</IconButton>

										<CloseButton onClick={onClose} aria-label="Close drawer" />
									</HStack>
								</HStack>
							</HStack>

							<CodeInput
								mb="xs"
								value={recordId}
								onBlur={gotoRecord}
								onSubmit={gotoRecord}
								onChange={setRecordId}
								variant="filled"
								rightSectionWidth={76}
								styles={{
									input: {
										fontFamily: 'JetBrains Mono',
										fontSize: '14px',
										color: inputColor,
										borderColor: inputColor,
									},
								}}
								rightSection={
									currentRecord.isEdge && (
										<Badge>
											Edge
										</Badge>
									)
								}
							/>

							{currentRecord.exists ? (
								<ChakraTabs.Root defaultValue="content" variant='outline' asChild>
									<Stack flex={1} gap={0}>
										<ChakraTabs.List>
											<ChakraTabs.Trigger value="content">
												Content
												<IconJSON />
											</ChakraTabs.Trigger>
											<ChakraTabs.Trigger value="relations">
												Relations
												<IconTransfer />
											</ChakraTabs.Trigger>
										</ChakraTabs.List>
										<ChakraTabs.Content value="content" flex={1} p={0}>

												<ContentTab value={recordBody} error={error} saveHandle={saveHandle} onChange={setRecordBody} />

										</ChakraTabs.Content>
										<ChakraTabs.Content value="relations">
											<RelationsTab isLight={isLight} inputs={currentRecord.inputs} outputs={currentRecord.outputs} />
										</ChakraTabs.Content>
									</Stack>
								</ChakraTabs.Root>
							) : (
								<Center my="xl">
									<Text>Record not found in database</Text>
								</Center>
							)}
						</Stack>
					</ChakraDrawer.Content>
				</ChakraDrawer.Positioner>
			</Portal>
		</ChakraDrawer.Root>
	)
}
