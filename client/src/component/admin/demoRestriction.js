import { useState } from "react";
import ApiService from "../../service/ApiService";

export const NO_PERMISSION_MESSAGE = "You do not have permission for this";

/**
 * Demo read-only mode for the ADMIN_RESTRICTED role.
 * readOnly        - true when the logged-in user is ADMIN_RESTRICTED
 * permissionMessage - transient "no permission" message to render
 * blockWrite      - call from a guarded write action handler
 * guardProps      - spread on a write button: blocks the action and
 *                   renders the button in a disabled-looking style
 */
export const useDemoRestriction = () => {
    const [permissionMessage, setPermissionMessage] = useState("");
    const readOnly = ApiService.isRestrictedAdmin();

    const blockWrite = () => {
        setPermissionMessage(NO_PERMISSION_MESSAGE);
        setTimeout(() => setPermissionMessage(""), 4000);
    };

    return { readOnly, permissionMessage, blockWrite };
};
