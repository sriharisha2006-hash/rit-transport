-- Migration: Add lat and lng columns to stops table
-- Description: Adds coordinates (latitude and longitude) columns to the stops table for geographic positioning.

ALTER TABLE stops ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE stops ADD COLUMN IF NOT EXISTS lng double precision;
