import {  Notification } from "@mantine/core";
import { clsx } from "clsx";
import { Button, ButtonGroup, HStack, Portal } from "@chakra-ui/react"
import { capitalize } from "radash";
import type { ReactNode } from "react";
import type { SaveableHandle } from "~/hooks/save";
import classes from "./style.module.scss";
import { LuCheck as IconCheck, LuInfo as IconHelp } from "react-icons/lu"

export interface SaveBoxProps {
	handle: SaveableHandle;
	inline?: boolean;
	inlineProps?: any;
	minimal?: boolean;
	withApply?: boolean;
	position?: "left" | "center" | "right";
	saveText?: ReactNode;
	applyText?: ReactNode;
	revertText?: ReactNode;
}

/**
 * Used to present the managed state of a `useSaveable` hook
 * in the form of a save box.
 */
export function SaveBox({
	handle,
	inline,
	inlineProps,
	position,
	saveText,
	minimal,
	withApply,
	applyText,
	revertText,
}: SaveBoxProps) {
	const saveButton = (
		<Button
			minWidth={100}
			variant="outline"
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={() => handle.save(false)}
		>
			{saveText ?? (minimal ? "Save changes" : "Save")} <IconCheck />
		</Button>
	);

	const applyButton = (
		<Button
			minWidth={100}
			px="xl"
			colorPalette="gray"
			variant="outline"
			loading={handle.isSaving}
			disabled={!handle.isSaveable}
			onClick={() => handle.save(true)}
		>
			{applyText ?? "Apply"}
		</Button>
	);

	const revertButton = (
		<Button
			px="xl"
			disabled={!handle.isChanged}
			onClick={handle.revert}
			colorPalette="gray"
			variant="outline"
		>
			{revertText ?? (minimal ? "Revert" : "Revert changes")}
		</Button>
	);

	if (inline) {
		return (
			<HStack
				gap={10}
				w={'full'}

			>
				<HStack w={'full'}>
					{revertButton}
				</HStack>

				<HStack w={'full'} justify="flex-end">
					{(withApply || !minimal) && (
						<>
							{withApply && applyButton}
							{saveButton}
						</>
					)}

					{!withApply && minimal && saveButton}
				</HStack>
			</HStack>
		);
	}

	return (
		<Portal>
			<Notification
				withCloseButton={false}
				className={clsx(
					classes.savebox,
					classes[`savebox${capitalize(position ?? "center")}`],
					!handle.isChanged && classes.saveboxHidden,
				)}
				icon={
					<IconHelp />
				}
				styles={{
					icon: {
						backgroundColor: "transparent !important",
						color: "var(--mantine-color-surreal-5) !important",
					},
					body: {
						margin: 0,
					},
				}}
			>
				<HStack
					justify="space-between"
					alignItems="center"
					flex={1}
					w={'full'}
				>
					<HStack>
						There are unsaved changes
						{revertButton}
					</HStack>
					<ButtonGroup>
						{withApply && applyButton}
						{saveButton}
					</ButtonGroup>
				</HStack>
			</Notification>
		</Portal>
	);
}
