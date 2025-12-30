package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model

	DisplayName  string
	Email        string
	ProfilePic   string
	PasswordHash string
}

type Following struct {
	FollowerID  uint `gorm:"primaryKey"`
	FollowingID uint `gorm:"primaryKey"`
	CreatedAt   time.Time
}
