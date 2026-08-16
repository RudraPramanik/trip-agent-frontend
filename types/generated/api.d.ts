export interface paths {
    "/api/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_api_v1_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Google Oauth Start
         * @description Start Google OAuth flow, or report when OAuth is not configured.
         */
        get: operations["google_oauth_start_api_v1_auth_google_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Google Oauth Callback
         * @description Handle OAuth redirect from Google; set wandr_token on success.
         */
        get: operations["google_oauth_callback_api_v1_auth_callback_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Auth Me
         * @description Current user or guest info; ensures httpOnly wandr_session cookie.
         */
        get: operations["auth_me_api_v1_auth_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Logout
         * @description Clear auth cookie. No auth required.
         */
        post: operations["logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/destinations/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search Destinations
         * @description DB-first search with Nominatim cache-aside fallback.
         */
        get: operations["search_destinations_api_v1_destinations_search_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/destinations/{destination_id}/readiness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Destination Readiness
         * @description Readiness score for a destination (pure compute_readiness via service).
         */
        get: operations["get_destination_readiness_api_v1_destinations__destination_id__readiness_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/destinations/{destination_id}/prepare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Prepare Destination
         * @description Public Overpass seed kickoff. 200 if already at floor; 202 if scrape started.
         */
        post: operations["prepare_destination_api_v1_destinations__destination_id__prepare_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/places": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Places
         * @description Paginated places for a destination. Unknown destination → 404.
         */
        get: operations["list_places_api_v1_places_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/places/{place_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Place
         * @description Single place by id. Unknown place → 404.
         */
        get: operations["get_place_api_v1_places__place_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/planner/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Generate Plan
         * @description Stream planner progress as SSE. Buffers terminal events, saves trip on
         *     itinerary_done, yields exactly one enriched terminal frame.
         */
        post: operations["generate_plan_api_v1_planner_generate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Trips
         * @description Paginated trips for the authenticated user.
         */
        get: operations["list_trips_api_v1_trips_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips/{trip_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Trip
         * @description Single trip — optional_auth + ownership (guest session or owner).
         */
        get: operations["get_trip_api_v1_trips__trip_id__get"];
        put?: never;
        post?: never;
        /** Delete Trip */
        delete: operations["delete_trip_api_v1_trips__trip_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips/{trip_id}/geojson": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Trip Geojson
         * @description Public GeoJSON FeatureCollection for map renderers (geojson.io).
         *     Intentional envelope exception — not wrapped in ApiResponse.
         */
        get: operations["get_trip_geojson_api_v1_trips__trip_id__geojson_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips/{trip_id}/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Claim Trip
         * @description Claim an anonymous trip after login (session must match; unclaimed only).
         */
        post: operations["claim_trip_api_v1_trips__trip_id__claim_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips/{trip_id}/days/{day}/stops/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Reorder Day Stops */
        patch: operations["reorder_day_stops_api_v1_trips__trip_id__days__day__stops_reorder_patch"];
        trace?: never;
    };
    "/api/v1/trips/{trip_id}/days/{day}/stops/{place_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove Day Stop */
        delete: operations["remove_day_stop_api_v1_trips__trip_id__days__day__stops__place_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips/{trip_id}/days/{day}/stops": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Day Stop */
        post: operations["add_day_stop_api_v1_trips__trip_id__days__day__stops_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/trips/{trip_id}/days/{day}/reoptimize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reoptimize Day */
        post: operations["reoptimize_day_api_v1_trips__trip_id__days__day__reoptimize_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AddStopIn */
        AddStopIn: {
            /**
             * Place Id
             * Format: uuid
             */
            place_id: string;
        };
        /** ApiResponse[AuthMeResponse] */
        ApiResponse_AuthMeResponse_: {
            /**
             * Success
             * @default true
             */
            success: boolean;
            data: components["schemas"]["AuthMeResponse"];
            /** Message */
            message?: string | null;
        };
        /** ApiResponse[DestinationPrepareOut] */
        ApiResponse_DestinationPrepareOut_: {
            /**
             * Success
             * @default true
             */
            success: boolean;
            data: components["schemas"]["DestinationPrepareOut"];
            /** Message */
            message?: string | null;
        };
        /** ApiResponse[DestinationReadinessOut] */
        ApiResponse_DestinationReadinessOut_: {
            /**
             * Success
             * @default true
             */
            success: boolean;
            data: components["schemas"]["DestinationReadinessOut"];
            /** Message */
            message?: string | null;
        };
        /** ApiResponse[PlaceOut] */
        ApiResponse_PlaceOut_: {
            /**
             * Success
             * @default true
             */
            success: boolean;
            data: components["schemas"]["PlaceOut"];
            /** Message */
            message?: string | null;
        };
        /** ApiResponse[TripOut] */
        ApiResponse_TripOut_: {
            /**
             * Success
             * @default true
             */
            success: boolean;
            data: components["schemas"]["TripOut"];
            /** Message */
            message?: string | null;
        };
        /** ApiResponse[list[DestinationOut]] */
        ApiResponse_list_DestinationOut__: {
            /**
             * Success
             * @default true
             */
            success: boolean;
            /** Data */
            data: components["schemas"]["DestinationOut"][];
            /** Message */
            message?: string | null;
        };
        /**
         * AuthMeResponse
         * @description Response for GET /auth/me — works for both guests and authenticated users.
         *     Guests: is_guest=True, user=None, session_id set.
         *     Authenticated: is_guest=False, user=UserOut, session_id set.
         */
        AuthMeResponse: {
            /** Is Guest */
            is_guest: boolean;
            /** Session Id */
            session_id: string;
            user?: components["schemas"]["UserOut"] | null;
        };
        /** DestinationOut */
        DestinationOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Name */
            name: string;
            /** Country */
            country: string;
            /** Display Name */
            display_name: string;
            /** Lat */
            lat: number;
            /** Lng */
            lng: number;
            /**
             * Place Count
             * @default 0
             */
            place_count: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** DestinationPrepareOut */
        DestinationPrepareOut: {
            /**
             * Destination Id
             * Format: uuid
             */
            destination_id: string;
            /**
             * Status
             * @enum {string}
             */
            status: "ready" | "preparing";
            /** Place Count */
            place_count: number;
        };
        /** DestinationReadinessOut */
        DestinationReadinessOut: {
            /**
             * Destination Id
             * Format: uuid
             */
            destination_id: string;
            /** Score */
            score: number;
            /**
             * Tier
             * @enum {string}
             */
            tier: "ready" | "limited" | "sparse";
            /** Place Count */
            place_count: number;
            /** Enriched Pct */
            enriched_pct: number;
            /** Indexed Pct */
            indexed_pct: number;
            /** Message */
            message?: string | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** PaginatedResponse[PlaceOut] */
        PaginatedResponse_PlaceOut_: {
            /** Items */
            items: components["schemas"]["PlaceOut"][];
            /** Total */
            total: number;
            /** Page */
            page: number;
            /** Size */
            size: number;
            /**
             * Pages
             * @default 1
             */
            pages: number;
            /**
             * Has Next
             * @default false
             */
            has_next: boolean;
            /**
             * Has Prev
             * @default false
             */
            has_prev: boolean;
        };
        /** PaginatedResponse[TripOut] */
        PaginatedResponse_TripOut_: {
            /** Items */
            items: components["schemas"]["TripOut"][];
            /** Total */
            total: number;
            /** Page */
            page: number;
            /** Size */
            size: number;
            /**
             * Pages
             * @default 1
             */
            pages: number;
            /**
             * Has Next
             * @default false
             */
            has_next: boolean;
            /**
             * Has Prev
             * @default false
             */
            has_prev: boolean;
        };
        /** PlaceOut */
        PlaceOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Osm Id */
            osm_id: string;
            /** Name */
            name: string;
            /** Category */
            category: string;
            /** Tags */
            tags: {
                [key: string]: unknown;
            };
            /** Summary */
            summary: string | null;
            /** Lat */
            lat: number;
            /** Lng */
            lng: number;
            /**
             * Destination Id
             * Format: uuid
             */
            destination_id: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /**
         * PlanRequest
         * @description Body for POST /api/v1/planner/generate.
         */
        PlanRequest: {
            /**
             * Destination Id
             * Format: uuid
             */
            destination_id: string;
            /** Raw Input */
            raw_input: string;
            /** Days */
            days?: number | null;
            /** Base Lat */
            base_lat?: number | null;
            /** Base Lng */
            base_lng?: number | null;
            /** Accommodation Label */
            accommodation_label?: string | null;
        };
        /** PrepareIn */
        PrepareIn: {
            /** Radius Km */
            radius_km?: number | null;
        };
        /** ReorderStopsIn */
        ReorderStopsIn: {
            /** Place Ids */
            place_ids: string[];
        };
        /** TripOut */
        TripOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** User Id */
            user_id: string | null;
            /** Session Id */
            session_id: string;
            /**
             * Destination Id
             * Format: uuid
             */
            destination_id: string;
            /** Days */
            days: number;
            /** Preferences */
            preferences?: {
                [key: string]: unknown;
            };
            status: components["schemas"]["TripStatus"];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Places */
            places?: components["schemas"]["TripPlaceOut"][];
        };
        /** TripPlaceOut */
        TripPlaceOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Place Id
             * Format: uuid
             */
            place_id: string;
            /** Day Number */
            day_number: number;
            /** Order In Day */
            order_in_day: number;
            /** Travel Time Min */
            travel_time_min: number;
            /** Visit Duration Min */
            visit_duration_min: number;
            /** Suggested Start Time */
            suggested_start_time?: string | null;
            /** Arrival Note */
            arrival_note?: string | null;
            /** Polyline */
            polyline?: string | null;
            /** Name */
            name?: string | null;
            /** Lat */
            lat?: number | null;
            /** Lng */
            lng?: number | null;
        };
        /**
         * TripStatus
         * @enum {string}
         */
        TripStatus: "draft" | "complete" | "failed";
        /**
         * UserOut
         * @description Public representation of a User. Used in all auth responses.
         */
        UserOut: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Name */
            name: string;
            /** Avatar Url */
            avatar_url: string | null;
            /** Is Active */
            is_active: boolean;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health_api_v1_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    google_oauth_start_api_v1_auth_google_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    google_oauth_callback_api_v1_auth_callback_get: {
        parameters: {
            query?: {
                code?: string | null;
                error?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    auth_me_api_v1_auth_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_AuthMeResponse_"];
                };
            };
        };
    };
    logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    search_destinations_api_v1_destinations_search_get: {
        parameters: {
            query: {
                q: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_list_DestinationOut__"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_destination_readiness_api_v1_destinations__destination_id__readiness_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                destination_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_DestinationReadinessOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    prepare_destination_api_v1_destinations__destination_id__prepare_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                destination_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PrepareIn"] | null;
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_DestinationPrepareOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_places_api_v1_places_get: {
        parameters: {
            query: {
                destination_id: string;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedResponse_PlaceOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_place_api_v1_places__place_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                place_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_PlaceOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_plan_api_v1_planner_generate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PlanRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_trips_api_v1_trips_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginatedResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_trip_api_v1_trips__trip_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_trip_api_v1_trips__trip_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_trip_geojson_api_v1_trips__trip_id__geojson_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    claim_trip_api_v1_trips__trip_id__claim_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reorder_day_stops_api_v1_trips__trip_id__days__day__stops_reorder_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
                day: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderStopsIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_day_stop_api_v1_trips__trip_id__days__day__stops__place_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
                day: number;
                place_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_day_stop_api_v1_trips__trip_id__days__day__stops_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
                day: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddStopIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reoptimize_day_api_v1_trips__trip_id__days__day__reoptimize_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trip_id: string;
                day: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiResponse_TripOut_"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
