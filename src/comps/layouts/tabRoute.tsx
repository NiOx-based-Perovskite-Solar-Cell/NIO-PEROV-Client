import {
    IconChartBar,
    IconDatabaseCog,
    IconAdjustmentsHorizontal,
    IconRobot,
} from "@tabler/icons-react";

export const tabDashboard = [
    {
        label: "สถิติ",
        route: "/dashboard/visualize",
        icon: <IconChartBar size={18} stroke={1.8} />,
    },
    {
        label: "Raw Data Config",
        route: "/dashboard/raw-data",
        icon: <IconDatabaseCog size={18} stroke={1.8} />,
    },
    {
        label: "Feature Data Config",
        route: "/dashboard/feature-data",
        icon: <IconAdjustmentsHorizontal size={18} stroke={1.8} />,
    },
    {
        label: "Method Prediction",
        route: "/dashboard/methods",
        icon: <IconRobot size={18} stroke={1.8} />,
    },
];
