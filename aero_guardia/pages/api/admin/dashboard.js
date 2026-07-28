import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/authOptions";
import {
    buildRegistrationTimeline,
    REGISTRATION_TIMELINE_DAYS,
} from "@/lib/adminDashboard";
import connectDB from "@/lib/mongodb";
import User from "@/models/users";
import Hangar from "@/models/hangars";
import Aircraft from "@/models/aircraft";

function isAdminSession(session) {
    return session?.user?.role === "admin";
}

async function getRegistrationAggregation(Model, days) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const results = await Model.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: start,
                },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt",
                    },
                },
                count: {
                    $sum: 1,
                },
            },
        },
        {
            $sort: {
                _id: 1,
            },
        },
    ]);

    return buildRegistrationTimeline(results, days);
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Método no permitido",
        });
    }

    try {
        const session = await getServerSession(req, res, authOptions);

        if (!isAdminSession(session)) {
            return res.status(401).json({
                error: "No autorizado",
            });
        }

        await connectDB();

        const days = REGISTRATION_TIMELINE_DAYS;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));

        const [
            usersCount,
            hangarsCount,
            aircraftCount,
            activeAircraftCount,
            reportsResult,
            statusBreakdown,
            usersTimelineRaw,
            hangarsTimelineRaw,
            aircraftTimelineRaw,
            activeUsers,
            activeHangars,
            recentAircraft,
        ] = await Promise.all([
            User.countDocuments(),
            Hangar.countDocuments(),
            Aircraft.countDocuments(),
            Aircraft.countDocuments({ status: { $ne: "Salida" } }),
            Aircraft.aggregate([
                {
                    $project: {
                        reportCount: {
                            $size: {
                                $ifNull: ["$reports", []],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalReports: {
                            $sum: "$reportCount",
                        },
                    },
                },
            ]),
            Aircraft.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        count: -1,
                    },
                },
            ]),
            User.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: start,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt",
                            },
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
            Hangar.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: start,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt",
                            },
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
            Aircraft.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: start,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt",
                            },
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ]),
            User.find()
                .select("name email role createdAt lastLogin")
                .sort({ createdAt: -1 })
                .limit(12)
                .lean(),
            Hangar.aggregate([
                {
                    $lookup: {
                        from: "aircrafts",
                        localField: "_id",
                        foreignField: "hangar",
                        as: "aircraftList",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "ownerDoc",
                    },
                },
                {
                    $project: {
                        name: 1,
                        location: 1,
                        baseAirport: 1,
                        classification: 1,
                        createdAt: 1,
                        membersCount: {
                            $size: {
                                $ifNull: ["$members", []],
                            },
                        },
                        aircraftCount: {
                            $size: "$aircraftList",
                        },
                        ownerName: {
                            $arrayElemAt: ["$ownerDoc.name", 0],
                        },
                        ownerEmail: {
                            $arrayElemAt: ["$ownerDoc.email", 0],
                        },
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                {
                    $limit: 12,
                },
            ]),
            Aircraft.find()
                .sort({ updatedAt: -1 })
                .limit(5)
                .populate("hangar", "name location")
                .populate("owner", "name email")
                .lean(),
        ]);

        return res.status(200).json({
            stats: {
                usersCount,
                hangarsCount,
                aircraftCount,
                activeAircraftCount,
                reportsCount: reportsResult[0]?.totalReports || 0,
            },
            timelines: {
                days,
                users: buildRegistrationTimeline(usersTimelineRaw, days),
                hangars: buildRegistrationTimeline(hangarsTimelineRaw, days),
                aircraft: buildRegistrationTimeline(
                    aircraftTimelineRaw,
                    days
                ),
            },
            statusBreakdown,
            activeUsers,
            activeHangars,
            recentAircraft,
        });
    } catch (error) {
        console.error("ERROR EN DASHBOARD ADMIN:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
}
