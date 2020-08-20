<template>
  <div class="home">
    <van-icon class="add" @click="show = true" size="30px" name="add" />
    <van-icon class="edit" @click="showEdit = true" size="30px" name="setting" />
    <section class="result" v-if="teams.blue">
      <div class="result-content">
        <div>
          <h3>蓝队</h3>
          <div>赢倍率：{{teams.blue.win}}</div>
          <div>输倍率：{{teams.blue.lose}}</div>
          <div v-for="person in teams.blue.persons" :key="person.name">
            {{person.name}} 赢：{{person.win}} 输：{{person.lose}}
          </div>
        </div>
        <div>
          <h3>红队</h3>
          <div>赢倍率：{{teams.red.win}}</div>
          <div>输倍率：{{teams.red.lose}}</div>
          <div v-for="person in teams.red.persons" :key="person.name">
            {{person.name}} 赢：{{person.win}} 输：{{person.lose}}
          </div>
        </div>
      </div>
      <div class="victory">胜者：
        <van-switch v-model="checked" active-color="#39a9ed" inactive-color="#ee0a24" />
        <van-field style="width:100px" v-model="mark" type="number" placeholder="分数" />
      </div>
      <div>
        <van-button type="primary" class="btn" size="small" @click="settlement">结算</van-button>
        <van-button type="info" class="btn btn-right" size="small" @click="cancel">取消</van-button>
      </div>
    </section>
    <van-button v-if="!teams.blue" type="primary" class="play" @click="play">排位</van-button>
    <van-checkbox-group v-model="result">
      <van-checkbox class="item" v-for="item in persons" :key="item.name" :name="item.name">
        <span class="name">{{item.name}}</span>
        <span class="value">{{item.score}}</span>
      </van-checkbox>
    </van-checkbox-group>

    <van-overlay :show="show" @click="show = false">
      <div class="wrapper" >
        <div class="content" @click.stop>
          <h4>添加游戏人员</h4>
          <van-field v-model="name" label="名字" placeholder="请输入名字" />
          <van-field v-model="score" label="分数" placeholder="请输入分数" />
          <van-button type="primary" class="btn" size="small" @click="submit">确定</van-button>
        </div>
      </div>
    </van-overlay>
    <van-overlay :show="showEdit" @click="showEdit = false">
      <div class="wrapper" >
        <div class="content" @click.stop>
          <h4>修改游戏人员</h4>
          <div class="items">
            <van-field v-for="item in persons" @blur="editScore(item)" :key="item.name" v-model="item.score" :label="item.name" placeholder="请输入分数" >
              <template #button>
                <van-icon name="clear" @click="deleteUser(item)" />
              </template>
            </van-field>
          </div>
        </div>
      </div>
    </van-overlay>
    <van-overlay :show="showScore" @click="showScore = false">
      <div class="wrapper" >
        <div class="content" v-if="teams.blue" @click.stop>
          <h4>确认分数</h4>
          <div>
            蓝队：
          </div>
          <div class="li" v-for="item in teams.blue.persons" :key="item.id">
            {{item.name}} 倍数：{{item.finallMultiple}} 分数：{{item.finallMark}}
          </div>
          <div>
            红队：
          </div>
          <div class="li" v-for="item in teams.red.persons" :key="item.id">
            {{item.name}} 倍数：{{item.finallMultiple}} 分数：{{item.finallMark}}
          </div>
          <van-button type="primary" class="btn" size="small" @click="confirm">确定</van-button>
        </div>
      </div>
    </van-overlay>
  </div>
</template>

<script>
import { addUser, getUser, delUser } from '@/apis/user'
// import { addUser, updateUser, getUser, delUser } from '@/apis/user'
import { updateScore } from '@/apis/score'
const base = 50
export default {
  name: 'Home',
  data () {
    return {
      show: false,
      showEdit: false,
      showScore: false,
      name: '',
      score: 0,
      result: [],
      persons: [],
      teams: {},
      checked: true,
      mark: undefined
    }
  },
  created () {
    this.getUserData()
  },
  methods: {
    getUserData () {
      getUser().then(res => {
        const data = res.data.data
        this.persons = data.sort((a, b) => b.score - a.score)
      })
    },
    confirm () {
      const params = []
      Object.keys(this.teams).forEach(team => {
        this.teams[team].persons.forEach(item => params.push({
          userId: item.id,
          score: item.score
        }))
      })
      this.editScore(params).then(res => {
        this.getUserData()
      })
      this.teams = {}
      this.mark = undefined
      this.showScore = false
    },
    editScore (item) {
      return new Promise((resolve, reject) => {
        if (item instanceof Array) {
          updateScore(item).then(res => { resolve() })
        } else {
          updateScore({
            userId: item.id,
            score: item.score
          }).then(res => { resolve() })
        }
      })
    },
    deleteUser (item) {
      delUser(item.id).then(res => {
        if (res.data.success) {
          this.persons = this.persons.filter(user => user.id !== item.id)
        } else {
          this.$toast('删除用户失败')
        }
      })
    },
    getInsideMultipleTeam (team) {
      const [person1, person2] = team
      const diff = Math.abs(person1.score - person2.score)
      const multiple = this.getSinMultiple(diff, base * 10, 0.4)
      const lessMultiple = parseFloat((0.5 - multiple).toFixed(2))
      const moreMultiple = parseFloat((0.5 + multiple).toFixed(2))
      if (person1.score >= person2.score) {
        person1.win = lessMultiple
        person1.lose = moreMultiple
        person2.win = moreMultiple
        person2.lose = lessMultiple
      } else {
        person1.win = moreMultiple
        person1.lose = lessMultiple
        person2.win = lessMultiple
        person2.lose = moreMultiple
      }
      return [person1, person2]
    },
    settlement () {
      if (this.mark === undefined) return
      // 依据蓝方计算分数
      const mark = this.checked ? parseInt(this.mark) : -parseInt(this.mark)
      this.persons.forEach(item => {
        this.teams.blue.persons.forEach(person => {
          const isWin = this.checked
          const finallMultiple = parseFloat(((isWin ? person.win : person.lose) * (isWin ? this.teams.blue.win : this.teams.blue.lose) * 2).toFixed(2))
          const finallMark = Math.round(finallMultiple * mark)
          person.finallMultiple = finallMultiple
          person.finallMark = finallMark
          if (person.name === item.name) {
            person.score = parseInt(person.score) + finallMark
          }
        })
        this.teams.red.persons.forEach(person => {
          const isWin = !this.checked
          const finallMultiple = parseFloat(((isWin ? person.win : person.lose) * (isWin ? this.teams.red.win : this.teams.red.lose) * 2).toFixed(2))
          const finallMark = -Math.round(finallMultiple * mark)
          person.finallMultiple = finallMultiple
          person.finallMark = finallMark
          if (person.name === item.name) {
            person.score = parseInt(person.score) + finallMark
          }
        })
      })
      this.showScore = true
    },
    cancel () {
      this.teams = {}
      this.mark = undefined
    },
    saveGame () {
      window.localStorage.setItem('persons', JSON.stringify(this.persons))
    },
    submit () {
      if (!this.name) return
      const exsit = this.persons.filter(item => item.name === this.name)
      if (exsit.length) {
        exsit[0].value = this.score
      } else {
        addUser({
          name: this.name,
          score: this.score
        }).then(res => {
          this.persons.push({
            name: this.name,
            score: this.score,
            id: res.data.data.id
          })
          this.name = ''
          this.score = 0
          this.show = false
        })
      }
    },
    getSinMultiple (mark, maxDiff, maxMuliple) {
      mark = Math.abs(mark)
      if (mark >= maxDiff) {
        return maxMuliple
      }
      return Math.sin(2 * Math.PI / 360 * 90 * mark / maxDiff) * maxMuliple
    },
    play () {
      if (this.result.length < 4) {
        this.$toast('请选择4人以上')
        return
      }
      const result = this.result.map(name => {
        return {
          name,
          score: parseInt(this.persons.filter(item => item.name === name)[0].score),
          id: parseInt(this.persons.filter(item => item.name === name)[0].id)
        }
      })
      // 获取蓝红两队
      const teamsPerson = this.getTeam(result)

      // 蓝队总分数
      const blueMark = teamsPerson.blue.reduce((total, item) => total + parseInt(item.score), 0)
      // 蓝队平均分
      const blueAverage = blueMark / 2
      // 红队总分数
      const redMark = teamsPerson.red.reduce((total, item) => total + parseInt(item.score), 0)
      // 红队平均分
      const redAverage = redMark / 2
      let blueTeamMultiple, redTeamMultiple
      // 红蓝队平均分差值
      const diff = Math.abs(blueAverage - redAverage)
      // 蓝队的平均分大于红队
      if (blueAverage >= redAverage) {
        // 蓝队胜利时，蓝队的倍率
        blueTeamMultiple = 1 - this.getSinMultiple(diff, base * 10, 0.9)
        // 红队胜利时，红队的倍率
        redTeamMultiple = diff / base + 1
      } else {
        // 蓝队胜利时，蓝队的倍率
        blueTeamMultiple = diff / base + 1
        // 红队胜利时，红队的倍率
        redTeamMultiple = 1 - this.getSinMultiple(diff, base * 10, 0.9)
      }
      // 队内的倍率
      teamsPerson.blue = this.getInsideMultipleTeam(teamsPerson.blue)
      teamsPerson.red = this.getInsideMultipleTeam(teamsPerson.red)
      this.teams = {
        blue: {
          persons: teamsPerson.blue,
          win: parseFloat(blueTeamMultiple.toFixed(2)),
          lose: parseFloat(redTeamMultiple.toFixed(2))
        },
        red: {
          persons: teamsPerson.red,
          win: parseFloat(redTeamMultiple.toFixed(2)),
          lose: parseFloat(blueTeamMultiple.toFixed(2))
        }
      }
    },
    getTeam (persons) {
      persons = [...persons]
      const random = (value) => {
        return Math.floor(Math.random() * value)
      }
      const selectList = []
      while (selectList.length < 4) {
        const currentIndex = random(persons.length)
        const person = persons[currentIndex]
        if (!selectList.includes(person)) {
          selectList.push(person)
        }
      }
      selectList.sort((a, b) => a.score - b.score)
      const blue = []
      const blueFirstIndex = random(2)
      const redFirstIndex = random(2) + 2
      blue.push(selectList.splice(redFirstIndex, 1)[0])
      blue.push(selectList.splice(blueFirstIndex, 1)[0])
      const red = selectList
      return {
        red,
        blue
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  .add {
    position: fixed;
    bottom: 10px;
    left: 10px;
  }
  .edit {
    position: fixed;
    bottom: 10px;
    left: 50px;
  }
  .play {
    margin-top: 20px;
    width: 100px
  }
  .item {
    margin-top: 10px
  }
  .name {
    display:inline-block;
    width: 60px;
  }
  .value {
    display: inline-block;
    width: 60px;
    text-align: center;
  }
  .result {
    width: 100%;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    .result-content {
      box-sizing: border-box;
      width: 100%;
      padding: 0 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  .victory {
    display: flex;
    align-items: center;
  }
  .btn {
    margin: 10px auto;
    width: 80px;
  }
  .btn-right {
    margin-left: 10px
  }
  .wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    .content {
      border-radius: 8px;
      padding: 10px 20px;
      h4 {
        margin: 10px auto;
      }
      .items {
        height: 300px;
        overflow: auto;
      }
      .li {
        margin: 5px auto;
      }
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #fff;

    }
  }
}

</style>
