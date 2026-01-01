package models

import (
	"database/sql/driver"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/paulmach/orb"
	"github.com/paulmach/orb/encoding/wkb"
	"github.com/paulmach/orb/encoding/wkt"
	"gorm.io/gorm"
)

type GeoPoint struct {
	Point orb.Point
}

func (GeoPoint) GormDataType() string {
	return "geometry(Point, 4326)"
}

func (p GeoPoint) Value() (driver.Value, error) {
	return fmt.Sprintf("SRID=4326;%v", wkt.MarshalString(p.Point)), nil
}

func (p *GeoPoint) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	switch v := value.(type) {
	case []byte:
		// Try treating as hex string first (common in some drivers)
		decoded, err := hex.DecodeString(string(v))
		if err == nil {
			scanner := wkb.Scanner(&p.Point)
			return scanner.Scan(decoded)
		}
		// Fallback to WKB scanner for raw bytes
		scanner := wkb.Scanner(&p.Point)
		return scanner.Scan(v)
	case string:
		// Try Hex first; if it fails, assume it's WKT (ST_AsText)
		decoded, err := hex.DecodeString(v)
		if err == nil {
			scanner := wkb.Scanner(&p.Point)
			return scanner.Scan(decoded)
		}
		// Fallback to ScanString for "POINT(...)" format
		return p.ScanString(v)
	default:
		return fmt.Errorf("cannot scan type %T into GeoPoint", value)
	}
}

func (p *GeoPoint) ScanString(v string) error {
	var lng, lat float64
	_, err := fmt.Sscanf(v, "POINT(%f %f)", &lng, &lat)
	if err != nil {
		return err
	}
	p.Point = orb.Point{lng, lat}
	return nil
}

type Journey struct {
	gorm.Model

	UserID      uint
	Title       string `gorm:"not null"`
	Description string
	IsPublic    bool      `gorm:"default:false"`
	StartedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	EndedAt     *time.Time
	Checkpoints []Checkpoint `gorm:"foreignKey:JourneyID;constraint:OnDelete:CASCADE;"`
}

type Checkpoint struct {
	gorm.Model

	JourneyID uint
	Location  GeoPoint `gorm:"type:geometry(Point, 4326)"`
	Timestamp time.Time
	Note      string
	Media     []Media `gorm:"foreignKey:CheckpointID;constraint:OnDelete:CASCADE;"`
}
