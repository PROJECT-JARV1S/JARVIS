// @generated automatically by Diesel CLI.

diesel::table! {
    permission_preferences (tool_name) {
        tool_name -> Text,
        decision -> Text,
    }
}

diesel::table! {
    session_history (session_id) {
        session_id -> Text,
        history_json -> Text,
    }
}

diesel::table! {
    sessions (id) {
        id -> Text,
        title -> Nullable<Text>,
        created_at -> BigInt,
        updated_at -> BigInt,
    }
}

diesel::joinable!(session_history -> sessions (session_id));

diesel::allow_tables_to_appear_in_same_query!(permission_preferences, session_history, sessions,);
