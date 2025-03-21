## API Report File for "@aws-amplify/cli-core"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="node" />

import { PackageManagerController } from '@aws-amplify/plugin-types';
import { WriteStream } from 'node:tty';
import z from 'zod';

// @public
export class AmplifyPrompter {
    static input: (options: {
        message: string;
        required?: never;
        defaultValue?: string;
    } | {
        message: string;
        required: true;
        defaultValue?: never;
    }) => Promise<string>;
    static secretValue: (promptMessage?: string) => Promise<string>;
    static yesOrNo: (options: {
        message: string;
        defaultValue?: boolean;
    }) => Promise<boolean>;
}

// @public (undocumented)
export type ColorName = (typeof colorNames)[number];

// @public (undocumented)
export const colorNames: readonly ["Green", "Yellow", "Blue", "Magenta", "Cyan"];

// @public
export class Format {
    constructor(packageManagerRunnerName?: string);
    // (undocumented)
    bold: (message: string) => string;
    // (undocumented)
    color: (message: string, colorName: ColorName) => string;
    // (undocumented)
    command: (command: string) => string;
    // (undocumented)
    dim: (message: string) => string;
    // (undocumented)
    error: (error: string | Error | unknown) => string;
    // (undocumented)
    highlight: (command: string) => string;
    // (undocumented)
    indent: (message: string) => string;
    // (undocumented)
    link: (link: string) => string;
    // (undocumented)
    list: (lines: string[]) => string;
    // (undocumented)
    normalizeAmpxCommand: (command: string) => string;
    // (undocumented)
    note: (message: string) => string;
    // (undocumented)
    record: (record: Record<string, string | number | Date>) => string;
    // (undocumented)
    sectionHeader: (header: string) => string;
    // (undocumented)
    success: (message: string) => string;
}

// @public (undocumented)
export const format: Format;

// @public (undocumented)
export enum LogLevel {
    // (undocumented)
    DEBUG = 2,
    // (undocumented)
    ERROR = 0,
    // (undocumented)
    INFO = 1
}

// @public (undocumented)
export type Notice = z.infer<typeof noticeSchema>;

// @public (undocumented)
export const noticeSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    details: z.ZodString;
    link: z.ZodOptional<z.ZodString>;
    predicates: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"packageVersion">;
        packageName: z.ZodString;
        versionRange: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "packageVersion";
        packageName: string;
        versionRange: string;
    }, {
        type: "packageVersion";
        packageName: string;
        versionRange: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"nodeVersion">;
        versionRange: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "nodeVersion";
        versionRange: string;
    }, {
        type: "nodeVersion";
        versionRange: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"osFamily">;
        osFamily: z.ZodEnum<["windows", "macos", "linux"]>;
    }, "strip", z.ZodTypeAny, {
        type: "osFamily";
        osFamily: "linux" | "windows" | "macos";
    }, {
        type: "osFamily";
        osFamily: "linux" | "windows" | "macos";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"backendComponent">;
        backendComponent: z.ZodEnum<["data", "auth", "function", "storage", "ai"]>;
    }, "strip", z.ZodTypeAny, {
        type: "backendComponent";
        backendComponent: "function" | "data" | "auth" | "storage" | "ai";
    }, {
        type: "backendComponent";
        backendComponent: "function" | "data" | "auth" | "storage" | "ai";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"command">;
        command: z.ZodEnum<["sandbox", "pipeline-deploy", "generate", "configure"]>;
    }, "strip", z.ZodTypeAny, {
        command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
        type: "command";
    }, {
        command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
        type: "command";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"errorMessage">;
        errorMessage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "errorMessage";
        errorMessage: string;
    }, {
        type: "errorMessage";
        errorMessage: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"frequency">;
        frequency: z.ZodEnum<["command", "deployment", "once", "daily"]>;
    }, "strip", z.ZodTypeAny, {
        type: "frequency";
        frequency: "once" | "command" | "deployment" | "daily";
    }, {
        type: "frequency";
        frequency: "once" | "command" | "deployment" | "daily";
    }>, z.ZodObject<{
        type: z.ZodLiteral<"validityPeriod">;
        from: z.ZodOptional<z.ZodNumber>;
        to: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "validityPeriod";
        from?: number | undefined;
        to?: number | undefined;
    }, {
        type: "validityPeriod";
        from?: number | undefined;
        to?: number | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    details: string;
    id: string;
    title: string;
    predicates: ({
        type: "packageVersion";
        packageName: string;
        versionRange: string;
    } | {
        type: "nodeVersion";
        versionRange: string;
    } | {
        type: "osFamily";
        osFamily: "linux" | "windows" | "macos";
    } | {
        type: "backendComponent";
        backendComponent: "function" | "data" | "auth" | "storage" | "ai";
    } | {
        command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
        type: "command";
    } | {
        type: "errorMessage";
        errorMessage: string;
    } | {
        type: "frequency";
        frequency: "once" | "command" | "deployment" | "daily";
    } | {
        type: "validityPeriod";
        from?: number | undefined;
        to?: number | undefined;
    })[];
    link?: string | undefined;
}, {
    details: string;
    id: string;
    title: string;
    predicates: ({
        type: "packageVersion";
        packageName: string;
        versionRange: string;
    } | {
        type: "nodeVersion";
        versionRange: string;
    } | {
        type: "osFamily";
        osFamily: "linux" | "windows" | "macos";
    } | {
        type: "backendComponent";
        backendComponent: "function" | "data" | "auth" | "storage" | "ai";
    } | {
        command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
        type: "command";
    } | {
        type: "errorMessage";
        errorMessage: string;
    } | {
        type: "frequency";
        frequency: "once" | "command" | "deployment" | "daily";
    } | {
        type: "validityPeriod";
        from?: number | undefined;
        to?: number | undefined;
    })[];
    link?: string | undefined;
}>;

// @public (undocumented)
export type NoticesManifest = z.infer<typeof noticesManifestSchema>;

// @public (undocumented)
export const noticesManifestSchema: z.ZodObject<{
    notices: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        details: z.ZodString;
        link: z.ZodOptional<z.ZodString>;
        predicates: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"packageVersion">;
            packageName: z.ZodString;
            versionRange: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "packageVersion";
            packageName: string;
            versionRange: string;
        }, {
            type: "packageVersion";
            packageName: string;
            versionRange: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"nodeVersion">;
            versionRange: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "nodeVersion";
            versionRange: string;
        }, {
            type: "nodeVersion";
            versionRange: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"osFamily">;
            osFamily: z.ZodEnum<["windows", "macos", "linux"]>;
        }, "strip", z.ZodTypeAny, {
            type: "osFamily";
            osFamily: "linux" | "windows" | "macos";
        }, {
            type: "osFamily";
            osFamily: "linux" | "windows" | "macos";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"backendComponent">;
            backendComponent: z.ZodEnum<["data", "auth", "function", "storage", "ai"]>;
        }, "strip", z.ZodTypeAny, {
            type: "backendComponent";
            backendComponent: "function" | "data" | "auth" | "storage" | "ai";
        }, {
            type: "backendComponent";
            backendComponent: "function" | "data" | "auth" | "storage" | "ai";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"command">;
            command: z.ZodEnum<["sandbox", "pipeline-deploy", "generate", "configure"]>;
        }, "strip", z.ZodTypeAny, {
            command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
            type: "command";
        }, {
            command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
            type: "command";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"errorMessage">;
            errorMessage: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "errorMessage";
            errorMessage: string;
        }, {
            type: "errorMessage";
            errorMessage: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"frequency">;
            frequency: z.ZodEnum<["command", "deployment", "once", "daily"]>;
        }, "strip", z.ZodTypeAny, {
            type: "frequency";
            frequency: "once" | "command" | "deployment" | "daily";
        }, {
            type: "frequency";
            frequency: "once" | "command" | "deployment" | "daily";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"validityPeriod">;
            from: z.ZodOptional<z.ZodNumber>;
            to: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "validityPeriod";
            from?: number | undefined;
            to?: number | undefined;
        }, {
            type: "validityPeriod";
            from?: number | undefined;
            to?: number | undefined;
        }>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        details: string;
        id: string;
        title: string;
        predicates: ({
            type: "packageVersion";
            packageName: string;
            versionRange: string;
        } | {
            type: "nodeVersion";
            versionRange: string;
        } | {
            type: "osFamily";
            osFamily: "linux" | "windows" | "macos";
        } | {
            type: "backendComponent";
            backendComponent: "function" | "data" | "auth" | "storage" | "ai";
        } | {
            command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
            type: "command";
        } | {
            type: "errorMessage";
            errorMessage: string;
        } | {
            type: "frequency";
            frequency: "once" | "command" | "deployment" | "daily";
        } | {
            type: "validityPeriod";
            from?: number | undefined;
            to?: number | undefined;
        })[];
        link?: string | undefined;
    }, {
        details: string;
        id: string;
        title: string;
        predicates: ({
            type: "packageVersion";
            packageName: string;
            versionRange: string;
        } | {
            type: "nodeVersion";
            versionRange: string;
        } | {
            type: "osFamily";
            osFamily: "linux" | "windows" | "macos";
        } | {
            type: "backendComponent";
            backendComponent: "function" | "data" | "auth" | "storage" | "ai";
        } | {
            command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
            type: "command";
        } | {
            type: "errorMessage";
            errorMessage: string;
        } | {
            type: "frequency";
            frequency: "once" | "command" | "deployment" | "daily";
        } | {
            type: "validityPeriod";
            from?: number | undefined;
            to?: number | undefined;
        })[];
        link?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    notices: {
        details: string;
        id: string;
        title: string;
        predicates: ({
            type: "packageVersion";
            packageName: string;
            versionRange: string;
        } | {
            type: "nodeVersion";
            versionRange: string;
        } | {
            type: "osFamily";
            osFamily: "linux" | "windows" | "macos";
        } | {
            type: "backendComponent";
            backendComponent: "function" | "data" | "auth" | "storage" | "ai";
        } | {
            command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
            type: "command";
        } | {
            type: "errorMessage";
            errorMessage: string;
        } | {
            type: "frequency";
            frequency: "once" | "command" | "deployment" | "daily";
        } | {
            type: "validityPeriod";
            from?: number | undefined;
            to?: number | undefined;
        })[];
        link?: string | undefined;
    }[];
}, {
    notices: {
        details: string;
        id: string;
        title: string;
        predicates: ({
            type: "packageVersion";
            packageName: string;
            versionRange: string;
        } | {
            type: "nodeVersion";
            versionRange: string;
        } | {
            type: "osFamily";
            osFamily: "linux" | "windows" | "macos";
        } | {
            type: "backendComponent";
            backendComponent: "function" | "data" | "auth" | "storage" | "ai";
        } | {
            command: "sandbox" | "pipeline-deploy" | "generate" | "configure";
            type: "command";
        } | {
            type: "errorMessage";
            errorMessage: string;
        } | {
            type: "frequency";
            frequency: "once" | "command" | "deployment" | "daily";
        } | {
            type: "validityPeriod";
            from?: number | undefined;
            to?: number | undefined;
        })[];
        link?: string | undefined;
    }[];
}>;

// @public
export class NoticesManifestValidator {
    constructor(props?: NoticesManifestValidatorProps | undefined, _fetch?: typeof fetch);
    // (undocumented)
    validate: (noticesManifest: NoticesManifest) => Promise<void>;
}

// @public (undocumented)
export type NoticesManifestValidatorProps = {
    checkLinksWithGitHubApi?: boolean;
};

// @public
export class PackageManagerControllerFactory {
    constructor(cwd?: string, printer?: Printer, platform?: NodeJS.Platform);
    getPackageManagerController(): PackageManagerController;
}

// @public
export class Printer {
    constructor(minimumLogLevel: LogLevel, stdout?: WriteStream | NodeJS.WritableStream, stderr?: WriteStream | NodeJS.WritableStream, refreshRate?: number, enableTTY?: boolean);
    indicateProgress: (message: string, callback: () => Promise<void>, successMessage?: string) => Promise<void>;
    // (undocumented)
    isSpinnerRunning: (id: string) => boolean;
    log: (message: string, level?: LogLevel) => void;
    print: (message: string) => void;
    printNewLine: () => void;
    startSpinner: (id: string, message: string, options?: {
        timeoutSeconds: number;
    }) => string;
    stopSpinner: (id: string) => void;
    updateSpinner: (id: string, options: {
        message?: string;
        prefixText?: string;
    }) => void;
}

// @public (undocumented)
export const printer: Printer;

// @public (undocumented)
export type RecordValue = string | number | string[] | Date;

// (No @packageDocumentation comment for this package)

```
