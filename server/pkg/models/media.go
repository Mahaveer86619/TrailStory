package models

import (
	"gorm.io/gorm"
)

type Media struct {
	gorm.Model

	CheckpointID uint
	URL          string `gorm:"not null"`
	Type         string // image, video
}
