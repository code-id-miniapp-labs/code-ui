import { ButtonProps } from '@code-ui/button';
export * from '@code-ui/button';
import { DrawerProps } from '@code-ui/drawer';
export * from '@code-ui/drawer';
export * from '@code-ui/miniapp';
export * from '@code-ui/core';
export * from '@code-ui/anatomy';

interface CuiCommonElementProps {
    id?: string;
    class?: string;
    className?: string;
    style?: string | Record<string, any>;
    slot?: string;
    key?: string | number;
    children?: any;
}
interface CuiButtonElementProps extends CuiCommonElementProps {
    ui?: ButtonProps["ui"];
    loading?: boolean;
    disabled?: boolean;
    variant?: ButtonProps["variant"];
    size?: ButtonProps["size"];
    loadingAuto?: boolean;
    autoResetDuration?: number;
    openType?: string;
    formType?: string;
    onTap?: (event?: any) => void;
    onClick?: (event?: any) => void;
    onGetPhoneNumber?: (event?: any) => void;
    onChooseAvatar?: (event?: any) => void;
}
interface CuiDrawerElementProps extends CuiCommonElementProps {
    ui?: DrawerProps["ui"];
    open?: boolean;
    placement?: DrawerProps["placement"];
    closeOnBackdropClick?: boolean;
    dismissible?: boolean;
    threshold?: number;
    duration?: number;
    onClose?: (event?: any) => void;
    onCloseTriggerTap?: (event: WechatMiniprogram.CustomEvent) => void;
    onBackdropTap?: (event: WechatMiniprogram.CustomEvent) => void;
    onDragStart?: (event: WechatMiniprogram.CustomEvent) => void;
    onDrag?: (event: WechatMiniprogram.CustomEvent) => void;
    onDragEnd?: (event: WechatMiniprogram.CustomEvent) => void;
}

export type { CuiButtonElementProps, CuiCommonElementProps, CuiDrawerElementProps };
